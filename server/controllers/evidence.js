import { pool } from '../config/database.js'
import { updateReaction } from '../utils/reactionService.js'

const createEvidence = async (req, res) => {
  // Create evidence submission
  try {
    const { case_id, text } = req.body
    const { user_id } = req.token_payload.user

    // get ev num
    const count_response = await pool.query(`
      SELECT COUNT(*) 
      FROM evidence
      WHERE case_id = $1`,
      [case_id])
    const ev_num = Number(count_response.rows[0].count) + 1

    // insert
    const response = await pool.query(`
      INSERT INTO evidence (case_id, user_id, evidence_num, text)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [case_id, user_id, ev_num, text])
    const data = response.rows[0]

    res.status(201).json(data)
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

const getEvidence = async (req, res) => {
  // Get specific evidence by ID
  try {
    const { id } = req.params
    res.json({ /* evidence data */ })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

const deleteEvidence = async (req, res) => {
  // Delete evidence (restricted by phase)
  try {
    const { id } = req.params
    res.json({ success: true })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

const voteEvidence = async (req, res) => {
  // Vote on evidence (discovery phase)
  try {
    const params = {
      submission_type: 'EVIDENCE',
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
    console.log("voteEvidence", error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const voteCountEvidence = async (req, res) => {
  // Get vote count for evidence
  const { id } = req.params
  try {
    res.json({ upvotes: 0, downvotes: 0 })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

export default { createEvidence, getEvidence, deleteEvidence, voteEvidence, voteCountEvidence }
