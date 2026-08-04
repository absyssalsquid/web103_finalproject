import { DateTime} from 'luxon'
import { pool } from '../config/database.js'
import { updateReaction } from '../utils/reactionService.js'
import {EDIT_LIMIT_MINUTES} from '../config/userRules.js'

// Dependency-injectable so tests can supply a fake pool/client, mirroring
// createUpdateUserController's pattern.
export function createArgumentController(deps = {}) {
  const dbPool = deps.pool ?? pool

  return async function createArgument(req, res) {
    const { case_id, text, argument_tag, case_citations, evidence_citations } = req.body
    const { user_id } = req.token_payload.user

    const client = await dbPool.connect()
    try {
      await client.query('BEGIN')

      // lock the case row so concurrent submissions to the same case can't
      // both read the same MAX(arg_num) and collide on UNIQUE(case_id, arg_num)
      await client.query(`SELECT case_id FROM cases WHERE case_id = $1 FOR UPDATE`, [case_id])

      const numResponse = await client.query(`
        SELECT COALESCE(MAX(arg_num), 0) + 1 AS next_num
        FROM arguments
        WHERE case_id = $1`,
        [case_id])
      const arg_num = Number(numResponse.rows[0].next_num)

      const insertResponse = await client.query(`
        INSERT INTO arguments (case_id, user_id, arg_num, text, argument_tag)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [case_id, user_id, arg_num, text, argument_tag])
      const argument = insertResponse.rows[0]

      if (evidence_citations.length > 0) {
        await client.query(`
          INSERT INTO argument_evidence_refs (arg_id, evidence_id)
          SELECT $1, unnest($2::int[])`,
          [argument.arg_id, evidence_citations])
      }

      if (case_citations.length > 0) {
        await client.query(`
          INSERT INTO argument_case_refs (arg_id, refd_case_id)
          SELECT $1, unnest($2::int[])`,
          [argument.arg_id, case_citations])
      }

      await client.query('COMMIT')

      res.status(201).json({
        ...argument,
        case_citations,
        evidence_citations,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      // citations are deduped and existence-checked before this ever runs, but
      // guard the primary-key case anyway rather than leaking a raw 500.
      // Only the citation join tables' own PKs mean "duplicate citation" —
      // e.g. arguments_case_id_arg_num_key is an arg_num collision, a
      // different (and more serious) failure that must not be masked.
      const CITATION_UNIQUE_CONSTRAINTS = new Set(['argument_case_refs_pkey', 'argument_evidence_refs_pkey'])
      if (error.code === '23505' && CITATION_UNIQUE_CONSTRAINTS.has(error.constraint)) {
        console.log('createArgument duplicate citation', error.message)
        return res.status(400).json({ error: 'Duplicate citation.' })
      }
      console.log('createArgument', error.message)
      res.status(500).json({ error: "Internal server error." })
    } finally {
      client.release()
    }
  }
}

const createArgument = createArgumentController()

const getArgument = async (req, res) => {
  // Get specific argument by ID
  try {
    const { id } = req.params

    const result = await pool.query(`
      WITH arg_data AS (
        SELECT * FROM arguments WHERE arg_id = $1
      ),
      evidence_ids AS (
        SELECT COALESCE(array_agg(evidence_id), ARRAY[]::int[]) AS evidence_citations
        FROM argument_evidence_refs
        WHERE arg_id = $1
      ),
      case_ids AS (
        SELECT COALESCE(array_agg(refd_case_id), ARRAY[]::int[]) AS case_citations
        FROM argument_case_refs
        WHERE arg_id = $1
      )
      SELECT
        arg_data.*,
        evidence_ids.evidence_citations,
        case_ids.case_citations
      FROM arg_data
      CROSS JOIN evidence_ids
      CROSS JOIN case_ids`,
      [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Argument not found." })
    }
    const data = result.rows[0]

    // get ev body for display by editor
    const ev_response = await pool.query(`
      SELECT
        e.*,
        users.username
      FROM evidence AS e
      JOIN users
        ON e.user_id = users.user_id
      WHERE e.evidence_id = ANY($1)
    `, [data.evidence_citations]);
    data.evidence_citations_data = ev_response.rows

    // get case body for display by editor
    const case_response = await pool.query(`
      SELECT
        c.case_id, c.judge_id, c.judge_ruling,
        u.username AS judge_name
      FROM cases AS c
      JOIN users AS u
        ON c.judge_id = u.user_id
      WHERE c.case_id = ANY($1)
    `, [data.case_citations]);
    data.case_citations_data = case_response.rows

    res.json(result.rows[0])
  } catch (error) {
    console.log("getArgument", error)
    res.status(500).json({ error: "Internal server error." })
  }
}

const deleteArgument = async (req, res) => {
  // Delete argument (restricted by phase)
  const { user_id } = req.token_payload.user
  const { id } = req.params
  try {
    const del_response = await pool.query(`
      DELETE 
      FROM arguments AS a
      USING cases as c
      WHERE c.case_id = a.case_id
        AND a.arg_id = $1
        AND a.user_id = $2
        AND c.phase = $3
      RETURNING a.user_id
    `, [id, user_id, 'ARGUMENT'])
    
    if (del_response.rows.length === 0)
      return res.status(404).json({error: "You cannot delete this argument."})

    await pool.query(`
      DELETE
      FROM reactions
      WHERE submission_type = $1
        AND submission_id = $2
    `, ['ARGUMENT', id])

    res.status(204).json()

  } catch (error) {
    console.log("deleteArgument", error.message)
    res.status(500).json({ error: "Internal server error." })
  }
}

const voteArgument = async (req, res) => {
  // Vote on argument (argument phase)
  try {
    const params = {
      submission_type: 'ARGUMENT',
      submission_id: req.params.id,
      user_id: req.token_payload.user.user_id,
      reaction: req.body.reaction,
      case_id: req.body.case_id,
    }
    
    const response = await updateReaction(params)
    if (!response.ok)
      return res.status(response.status).json(response.message)
    res.status(response.status).json(response.data)

  } catch (error) {
    console.log("voteArgument", error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const updateArgument = async (req, res) => {
  // Update argument (restricted by phase/time)
  const { user_id } = req.token_payload.user
  const { id } = req.params
  const { case_id, text, argument_tag, case_citations, evidence_citations } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Verify user owns the argument
    const argResponse = await client.query(`
      SELECT arg_id, case_id, user_id, created_at
      FROM arguments
      WHERE arg_id = $1`,
      [id])

    if (argResponse.rows.length === 0) 
      return res.status(404).json({ error: "Argument not found." })
    
    const argData = argResponse.rows[0]
    if (argData.user_id != user_id)
      return res.status(403).json({ error: "This is not your argument." })

    if (DateTime.now().plus({minutes:-5}) > argData.created_at)
      return res.status(404).json({ error: `Arguments can only be edited up to ${EDIT_LIMIT_MINUTES} minutes after submission.` })

    // Update the argument
    await client.query(`
      UPDATE arguments
      SET text = $1, argument_tag = $2
      WHERE arg_id = $3`,
      [text, argument_tag, id])

    // Update evidence citations
    let ev_c = []
    await client.query(`DELETE FROM argument_evidence_refs WHERE arg_id = $1`, [id])
    if (evidence_citations.length > 0) {
      const response = await client.query(`
        WITH ins AS (
          INSERT INTO argument_evidence_refs (arg_id, evidence_id)
          SELECT $1, unnest($2::int[])
          RETURNING evidence_id
        )
        SELECT COALESCE(array_agg(evidence_id), ARRAY[]::int[]) AS evidence_ids
        FROM ins
      `, [id, evidence_citations]);
      ev_c = response.rows[0]
    }

    // Update case citations
    let cc = []
    await client.query(`DELETE FROM argument_case_refs WHERE arg_id = $1`, [id])
    if (case_citations.length > 0){
      const response = await client.query(`
        WITH ins AS (
          INSERT INTO argument_case_refs (arg_id, refd_case_id)
          SELECT $1, unnest($2::int[])
          RETURNING refd_case_id
        )
        SELECT COALESCE(array_agg(refd_case_id), ARRAY[]::int[]) AS refd_case_ids
        FROM ins
      `, [id, case_citations]);
      cc = response.rows[0]
    }

    await client.query('COMMIT')
    console.log("finished")

    res.json({
      arg_id: id,
      case_id,
      text,
      argument_tag,
      case_citations: cc,
      evidence_citations: ev_c,
    })
  } catch (error) {
    console.log('updateArgument', error.message)

    await client.query('ROLLBACK')
    const CITATION_UNIQUE_CONSTRAINTS = new Set(['argument_case_refs_pkey', 'argument_evidence_refs_pkey'])
    if (error.code === '23505' && CITATION_UNIQUE_CONSTRAINTS.has(error.constraint)) {
      console.log('updateArgument duplicate citation', error.message)
      return res.status(400).json({ error: 'Duplicate citation.' })
    }
    res.status(500).json({ error: "Internal server error." })
  } finally {
    client.release()
  }
}

const voteCountArgument = async (req, res) => {
  // Get vote count for argument
  try {
    const { id } = req.params
    res.json({ upvotes: 0, downvotes: 0 })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error." })
  }
}

export default { createArgument, getArgument, deleteArgument, updateArgument, voteArgument, voteCountArgument }
