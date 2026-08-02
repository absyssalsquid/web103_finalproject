import { pool } from '../config/database.js'
import { updateReaction } from '../utils/reactionService.js'

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
    res.json({ /* argument data */ })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error." })
  }
}

const deleteArgument = async (req, res) => {
  // Delete argument (restricted by phase)
  try {
    const { id } = req.params
    res.json({ success: true })
  } catch (error) {
    console.log(error.message)
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

export default { createArgument, getArgument, deleteArgument, voteArgument, voteCountArgument }
