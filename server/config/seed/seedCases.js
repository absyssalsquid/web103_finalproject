import { pool } from '../database.js'
import { DateTime} from 'luxon'
import '../dotenv.js'

import { generateCases , generateEvidence, generateArguments, generateJuryBallots } from './data/generators.js'
import { getRandomInt } from '../../utils/time.js'
import { phaseDelta } from '../../utils/phaseMath.js'
import { bulletPt, processResults } from './utils.js'

import { CASE_TABLES } from './data/tables.js'

async function insertCase(cased){
    try {
        const result = await pool.query(`
            INSERT INTO cases (
                user_id, created_at, 
                object_name, accusation, image_url, 
                phase, phase_start, phase_end,
                up_votes, down_votes
                )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING case_id`,
            [cased.user_id, cased.created_at.toISO(), 
             cased.object_name, cased.accusation, cased.image_url,
             cased.phase, cased.phase_start.toISO(), cased.phase_end?.toISO(), 
             cased.up_votes, cased.down_votes
            ]
        );
        cased.case_id = result.rows[0].case_id
        return cased.case_id
    } catch (err) {
        console.error(`${bulletPt(0)} error creating case: ${cased.object_name}`, err)
        return null
    }
}

async function seedEvidence(case_id, arr){
    const results = await Promise.allSettled(
        arr.map(ev => pool.query(`
            INSERT INTO evidence (case_id, user_id, evidence_num, text, up_votes, down_votes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING evidence_id`,
            [case_id, ev.user_id, ev.evidence_num, ev.text, ev.up_votes, ev.down_votes]
        ))
    )
    const success_count = results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, arr.length)} seeded ${success_count}/${arr.length} pieces of evidence`)

    const callback = (result, i) => arr[i].evidence_id = result.value.rows[0].evidence_id
    processResults(results, "evidence", callback)
}

async function seedArguments(case_id, arr){
    const arg_results = await Promise.allSettled(
        arr.map((arg) => pool.query(`
            WITH new_row AS (
                INSERT INTO arguments (case_id, user_id, arg_num, text, argument_tag, up_votes, down_votes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING arg_id
            ),
            ins AS (
                INSERT INTO argument_evidence_refs (arg_id, evidence_id)
                SELECT arg_id, unnest($8::int[])
                FROM new_row
            )
            SELECT arg_id
            FROM new_row;
            `,
            [case_id, arg.user_id, arg.arg_num, arg.text, arg.argument_tag, arg.up_votes, arg.down_votes, arg.cited_evidence_ids]
        ))
    )
    let success_count = arg_results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, arr.length)} seeded ${success_count}/${arr.length} arguments`)

    const callback = (result, i) => arr[i].arg_id = result.value.rows[0].arg_id
    processResults(arg_results, "argument", callback)    
}

async function seedJuryAssignments(arr){
    const ballot_results = await Promise.allSettled(
        arr.map((ballot)=>pool.query(`
            INSERT INTO jury_assignments (case_id, user_id, vote, created_at, expires_at, completed_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [ballot.case_id, ballot.user_id, ballot.vote, ballot.created_at.toISO(), ballot.expires_at.toISO(), ballot.completed_at?.toISO()]
        ))
    )
    let success_count = ballot_results.filter(r => r.status === 'fulfilled').length
    console.log(`${bulletPt(success_count, arr.length)} seeded ${success_count}/${arr.length} jury assignments`)

    processResults(ballot_results, "jury assignments")
}

async function seedCases(){
    // clear tables
    for (const table of CASE_TABLES.toReversed()){
        await pool.query(`DELETE FROM ${table}`)
        console.log(`wiped table ${table}`)
    } 

    // get users
    const res = await pool.query(`SELECT * FROM users`)
    const users = res.rows

    // create cases
    const cases_old = [] // generateCases(30, users, APP_INCEPTION_DATE)
    const cases_new = generateCases(20, users, DateTime.now().plus({days: -6}))
    const cases = [...cases_old, ...cases_new]

    // seed cases
    for (var i=0; i < cases.length; i++){
        const case_data = cases[i]
        await insertCase(case_data)
        const case_id = case_data.case_id
        if (!case_id) {
            console.log("failed to create case#", case_data.object_name, case_data.phase)
            continue
        }

        console.log(`case #${case_id}: ${case_data.object_name} at \t${case_data.phase}`)
        if (case_data.phase === 'PROVISIONAL') continue
        if (case_data.phase === 'DISMISSED') continue

        // seed evidence
        const ev_count = getRandomInt(5, 35)
        const evidence = generateEvidence(ev_count, users)
        await seedEvidence(case_id, evidence)
        const ev_ids = evidence.filter(ev => ev.evidence_id).map(ev => ev.evidence_id)
        if (case_data.phase === 'DISCOVERY') continue

        // seed arguments
        const arg_count = getRandomInt(5, Math.floor(ev_count/2))
        const args = generateArguments(arg_count, users, ev_ids)
        await seedArguments(case_id, args)
        if (case_data.phase === 'ARGUMENT') continue

        // seed votes
        const ballots = generateJuryBallots(case_data, users)
        await seedJuryAssignments(ballots)
        if (case_data.phase === 'JURY_DELIBERATION') continue

        // calculate ruling
        let [guilty_count, not_guilty_count] = [0,0]
        for (const ballot of ballots){
            if (!ballot.vote) continue
            if (ballot.vote==='GUILTY') guilty_count++
            if (ballot.vote==='NOT_GUILTY') not_guilty_count++
        }

        let verdict
        if (guilty_count + not_guilty_count === 0) verdict = null
        else if (guilty_count === not_guilty_count) verdict = 'TB_PECKED_AT'
        else if (guilty_count > not_guilty_count) verdict = 'GUILTY'
        else if (guilty_count < not_guilty_count) verdict = 'NOT_GUILTY'
        
        await pool.query(`UPDATE cases SET verdict = $1 WHERE case_id = $2`, [verdict, case_data.case_id])

        if (phaseDelta(case_data.phase, 'JURY_DELIBERATION') < 0) continue

    }

    await pool.end(); 
}


seedCases()