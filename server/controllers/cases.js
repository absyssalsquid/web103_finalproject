import { pool } from '../config/database.js'

// fixed allowlist: user input selects a key here, never builds the SQL text itself
const ORDER_BY_CLAUSES = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
  countdown: 'phase_end ASC NULLS LAST',
}

const getCases = async (req, res) => {
  try {
    const { phase, status, sort } = req.query

    const conditions = []
    const params = []

    if (phase) {
      params.push(phase)
      conditions.push(`phase = $${params.length}`)
    }

    if (status !== undefined) {
      if (typeof status !== 'string') {
        return res.status(400).json({
         error: "Status must be 'open' or 'closed'.",
       })
     }

      const normalizedStatus = status.toLowerCase()
      if (normalizedStatus === 'closed') {
        conditions.push(`phase = 'CLOSED'`)
      } else if (normalizedStatus === 'open') {
        conditions.push(`phase != 'CLOSED'`)
      } else {
        return res.status(400).json({ error: `Invalid status: '${status}'. Must be 'open' or 'closed'.` })
      }
    }

    const sortOrder = sort === undefined ? 'newest' : sort

    if (typeof sortOrder !== 'string') {
      return res.status(400).json({
        error: "Sort must be 'newest', 'oldest', or 'countdown'.",
      })
    }

    const orderByClause = ORDER_BY_CLAUSES[sortOrder]
    if (!orderByClause) {
      return res.status(400).json({
        error: `Invalid sort: '${sortOrder}'. Must be 'newest', 'oldest', or 'countdown'.`,
      })
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const queryText = `SELECT * FROM cases ${whereClause} ORDER BY ${orderByClause}`

    const { rows } = await pool.query(queryText, params)
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const createCase = async (req, res) => {
  try {
    const { title, description } = req.body
    // Create new case
    res.json({ /* case data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const withdrawCase = async (req, res) => {
  try {
    const { id } = req.params
    // Withdraw case (only by case author)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getCase = async (req, res) => {
  try {
    const { id } = req.params
    // Get case card data
    res.json({ /* case card data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getCompleteCase = async (req, res) => {
  try {
    const { id } = req.params
    // Get full case data: details, evidence, arguments, jury summary, ruling
    res.json({ /* complete case data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const voteCase = async (req, res) => {
  try {
    const { id } = req.params
    const { value } = req.body
    // Vote on case (provisional phase)
    res.json({ /* vote data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleteVote = async (req, res) => {
  try {
    const { id } = req.params
    // Remove vote on case
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const voteCountCase = async (req, res) => {
  try {
    const { id } = req.params
    // Get vote count for case
    res.json({ upvotes: 0, downvotes: 0 })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getCaseEvidence = async (req, res) => {
  try {
    const { id } = req.params
    const { limit, offset, sort } = req.query
    // Get all evidence for case (?limit=20&offset=0&sort=oldest|newest|most-voted)
    res.json({ /* evidence list */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getCaseArguments = async (req, res) => {
  try {
    const { id } = req.params
    const { limit, offset, sort } = req.query
    // Get all arguments for case (?limit=20&offset=0&sort=oldest|newest|most-voted)
    res.json({ /* arguments list */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getJurySummary = async (req, res) => {
  try {
    const { id } = req.params
    // Get jury summary (count during phase, breakdown after phase ends)
    res.json({ /* jury summary */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const submitRuling = async (req, res) => {
  try {
    const { id } = req.params
    const { ruling } = req.body
    // Submit judge ruling after jury deliberation (only by judge)
    res.json({ /* ruling data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const changePhase = async (req, res) => {
  try {
    const { id } = req.params
    const { phase } = req.body
    // Update case phase (for rollback or manual advance, only presiding judge)
    res.json({ /* updated case */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default { getCases, createCase, withdrawCase, getCase, getCompleteCase, voteCase, deleteVote, voteCountCase, getCaseEvidence, getCaseArguments, getJurySummary, submitRuling, changePhase }
