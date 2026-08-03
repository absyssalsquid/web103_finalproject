import { pool } from '../config/database.js'
import { DateTime} from 'luxon'
import { updateReaction } from '../utils/reactionService.js'
import {EDIT_LIMIT_MINUTES} from '../config/userRules.js'

const createEvidence = async (req, res) => {
  // Create evidence submission
  const client = await pool.connect()
  try {
    const { case_id, text } = req.body
    const { user_id } = req.token_payload.user

    await client.query('BEGIN')
    await client.query(`SELECT case_id FROM cases WHERE case_id = $1 FOR UPDATE`, [case_id])

    // get ev num
    const numResponse = await client.query(`
      SELECT COALESCE(MAX(evidence_num), 0) + 1 AS next_num
      FROM evidence
      WHERE case_id = $1`,
      [case_id])
    const ev_num = Number(numResponse.rows[0].next_num)

    // insert
    const response = await client.query(`
      INSERT INTO evidence (case_id, user_id, evidence_num, text)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [case_id, user_id, ev_num, text])
    const data = response.rows[0]

    await client.query('COMMIT')

    return res.status(201).json(data)
  } catch (error) {
      console.log("createEvidence", error.message)
      return res.status(500).json({ error: "Internal server error" })
  } finally {
      client.release()
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
  const { user_id } = req.token_payload.user
  const { id } = req.params
  try {
    const del_response = await pool.query(`
      DELETE FROM evidence AS e
      USING cases AS c
      WHERE c.case_id = e.case_id
        AND e.evidence_id = $1
        AND e.user_id = $2
        AND c.phase = $3
      RETURNING e.user_id
    `, [id, user_id, 'DISCOVERY'])

    if (del_response.rows.length === 0)
      return res.status(400).json({error: "You cannot delete this evidence."})

    res.status(204).json()

  } catch (error) {
    console.log("deleteEvidence", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

const updateEvidence = async (req, res) => {
  // Delete evidence (restricted by phase)
  const { user_id } = req.token_payload.user
  const { id } = req.params
  const { text } = req.body

  try {
    const exists_response = await pool.query(`
      SELECT e.user_id, e.created_at, c.phase 
      FROM evidence AS e
      JOIN cases AS c
        ON e.case_id = c.case_id
      WHERE evidence_id = $1
    `, [id])
    if (exists_response.rows.length === 0)
      return res.status(404).json({error: "Evidence not found."})
    
    const row = exists_response.rows[0]
    if (row.user_id !== user_id)
      return res.status(403).json({ error: `This is not your evidence.` })

    if (row.phase !== 'DISCOVERY')
      return res.status(403).json({ error: `Evidence can only be edited within discovery phase.` })

    if (DateTime.now().plus({minutes:-5}) > row.created_at)
      return res.status(403).json({ error: `Evidence can only be edited up to ${EDIT_LIMIT_MINUTES} minutes after submission.` })

    const update_response = await pool.query(`
      UPDATE evidence
      SET text = $2
      WHERE evidence_id = $1
      RETURNING user_id
    `, [id, text]);

    if (update_response.rows.length === 0)
      return res.status(400).json({error: "Could not edit evidence."})

    res.status(204).json()

  } catch (error) {
    console.log("updateEvidence", error.message)
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

export default { createEvidence, getEvidence, updateEvidence, deleteEvidence, voteEvidence, voteCountEvidence }
