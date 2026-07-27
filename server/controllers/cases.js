import { pool } from '../config/database.js'
import { updateReaction } from '../utils/reactionService.js'

const getCases = async (req, res) => {
  try {
    const { phase, status, sort } = req.query

    let query = supabase.from('cases').select('*')

    if (phase) {
      query = query.eq('phase', phase)
    }

    if (status !== undefined) {
      if (typeof status !== 'string') {
        return res.status(400).json({
         error: "Status must be 'open' or 'closed'.",
       })
     }

      const normalizedStatus = status.toLowerCase()
      if (normalizedStatus === 'closed') {
        query = query.eq('phase', 'CLOSED')
      } else if (normalizedStatus === 'open') {
        query = query.neq('phase', 'CLOSED')
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

    if (sortOrder === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortOrder === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sortOrder === 'countdown') {
      query = query.order('phase_end', {
        ascending: true,
        nullsFirst: false,
      })
    } else {
      return res.status(400).json({
        error: `Invalid sort: '${sortOrder}'. Must be 'newest', 'oldest', or 'countdown'.`,
      })
    }

    const { data, error } = await query
    if (error) throw error

    res.json(data)
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
    // Vote on case (provisional phase)
    const params = {
      submission_type: 'case',
      submission_id: req.params.id,
      user_id: req.body.user_id,
      reaction: req.body.reaction,
    }
    const { status, message, data } = updateReaction(params)
    res.status(status).json(data || message)
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

export default { getCases, createCase, withdrawCase, getCase, getCompleteCase, voteCase, voteCountCase, getCaseEvidence, getCaseArguments, getJurySummary, submitRuling, changePhase }
