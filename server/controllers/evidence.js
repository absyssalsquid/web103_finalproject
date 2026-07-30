import { pool } from '../config/database.js'

const createEvidence = async (req, res) => {
  // Create evidence submission
  try {
    const { case_id, text } = req.body
    const { user_id } = req.token_payload.user

    console.log(case_id, text, user_id)

    // TODO: limit verification

    // get ev num
    const count_response = await pool.query(`
      SELECT COUNT(*) 
      FROM evidence
      WHERE case_id = $1`,
      [case_id])
    const ev_num = Number(count_response.rows[0].count) + 1
    console.log("ev#", ev_num)

    // insert
    const response = await pool.query(`
      INSERT INTO evidence (case_id, user_id, evidence_num, text)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [case_id, user_id, ev_num, text])
    const data = response.rows[0]
    console.log(data)

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
  // Vote on evidence (restricted to evidence phase)
  try {
    const { id } = req.params
    const { evidence_id, user_id, value } = req.body
    res.json({ /* vote data */ })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

const voteCountEvidence = async (req, res) => {
  // Get vote count for evidence
  try {
    const { id } = req.params
    res.json({ upvotes: 0, downvotes: 0 })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

export default { createEvidence, getEvidence, deleteEvidence, voteEvidence, voteCountEvidence }
