import { pool } from '../config/database.js'
import { DateTime } from 'luxon'
import { nextPhase } from '../utils/phaseMath.js' 
import { bulletPt } from '../config/seed/utils.js'
import { MIN_JURORS_FOR_VERDICT } from '../config/serverRules.js'

const client = await pool.connect()
await client.query('BEGIN')

async function calculateVerdict(case_id) {
    const summary_response = await pool.query(`
      SELECT vote, COUNT(*) as count
      FROM jury_assignments
      WHERE case_id = $1
        AND vote IS NOT NULL
      GROUP BY vote
    `, [case_id])

    const breakdown = {};
    for (const row of summary_response.rows) {
        breakdown[row.vote] = Number(row.count);
    }

    const total = (breakdown.GUILTY || 0) + (breakdown.NOT_GUILTY || 0)
    if (total === 0) return null
    if (total < MIN_JURORS_FOR_VERDICT) return null
    if (breakdown.GUILTY === breakdown.NOT_GUILTY) return 'TB_PECKED_AT'
    if (breakdown.GUILTY > breakdown.NOT_GUILTY) return 'GUILTY'
    return 'NOT_GUILTY'
}

async function updateVerdict(case_id, verdict) {
    return client.query(`
        UPDATE cases
        SET verdict = $2
        WHERE case_id = $1
        RETURNING case_id
    `, [case_id, verdict])
}

async function progressCase(c){
    const next_phase = nextPhase(c.phase)
    const phase_start = DateTime.now()
    const phase_end = next_phase === 'CLOSED' ? null : phase_start.plus({days: 1})

    return client.query(`
        UPDATE cases
        SET phase = $2, phase_start = $3, phase_end = $4
        WHERE case_id = $1
        RETURNING case_id
    `, [c.case_id, next_phase, phase_start.toISO(), phase_end?.toISO()])
}

async function progressCases(){

    try{
        const res = await client.query(`
            SELECT *
            FROM cases
            WHERE phase_end IS NOT NULL
                AND phase_end < NOW()
        `)

        const cases = res.rows
        if (cases.length === 0) return

        // update cases (serialize to avoid concurrent query warning)
        const p_fail_ids = []
        for (const c of cases) {
            try {
                await progressCase(c)
            } catch (e) {
                p_fail_ids.push(c.case_id)
            }
        }
        if (p_fail_ids.length > 0)
            throw Error(`Failed to progress cases: ${p_fail_ids.join(', ')}`)


        // calculate verdicts in parallel (read-only operation)
        const jury_cases = cases.filter(c => c.phase === 'JURY_DELIBERATION')
        const verdict_results = await Promise.allSettled(
            jury_cases.map(c => calculateVerdict(c.case_id))
        )

        // extract verdicts, tracking failures
        const verdicts = []
        const v_calc_fail_ids = []
        verdict_results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
                verdicts.push(result.value)
            } else {
                v_calc_fail_ids.push(jury_cases[i].case_id)
                verdicts.push(null)
            }
        })

        if (v_calc_fail_ids.length > 0)
            throw Error(`Failed to calculate verdict for cases: ${v_calc_fail_ids.join(', ')}`)

        // update verdicts (serialize to avoid concurrent query warning)
        const v_fail_ids = []
        for (const [i, c] of jury_cases.entries()) {
            try {
                await updateVerdict(c.case_id, verdicts[i])
            } catch (e) {
                v_fail_ids.push(c.case_id)
            }
        }

        if (v_fail_ids.length > 0)
            throw Error(`Failed to update verdict for cases: ${v_fail_ids.join(', ')}`)

        await client.query('COMMIT')
        console.log("completed update")
    } catch (error) {
      await client.query('ROLLBACK')
      console.log(error)
    } finally {
      await client.release()
    }

    await pool.end(); 
}

await progressCases()