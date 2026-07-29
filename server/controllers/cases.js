import { pool } from '../config/database.js'
import { updateReaction } from '../utils/reactionService.js'
import { dateWithDelta } from '../utils/time.js'

const sort_modes = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
  popular:   `(up_votes + down_votes) DESC`,
  prosecute: `((down_votes - up_votes)/total_votes) DESC`,
  defend:    `((up_votes - down_votes)/total_votes) DESC`,
  countdown: 'phase_end ASC NULLS LAST',
}

const filter_modes = {
  ALL: `TRUE`,
  ACTIVE: `phase_end IS NOT NULL`,
  ENDED: `phase_end IS NULL`,
  PROVISIONAL: `phase = 'PROVISIONAL' `,
  DISCOVERY: `phase = 'DISCOVERY' `,
  ARGUMENT: `phase = 'ARGUMENT' `,
  JURY_DELIBERATION: `phase = 'JURY_DELIBERATION' `,
  RULING: `phase = 'RULING' `,
  CLOSED: `phase = 'CLOSED' `,
  WITHDRAWN: `phase = 'WITHDRAWN' `,
  DISMISSED: `phase = 'DISMISSED' `
}

const getCases = async (req, res) => {
  let { filterBy, sortBy, limit, page } = req.query
  
  limit = Number(limit)
  if (!Number.isInteger(limit))
    return {status: 422, message: 'Invalid limit (number of results)'}
  else if (limit < 5 || limit > 50)
    return {status: 422, message: 'Limit (number of results) must be between 5 and 50.'}
  
  page = Number(page)
  if (!Number.isInteger(page))
    return {status: 422, message: 'Invalid page num'}
  else if (page < 1 )
    return {status: 422, message: 'Invalid page num'}

  const offset = (page-1) * limit;

  // check filter
  if (!(filterBy in filter_modes)){
    return res.status(422).json({
      error: "Invalid status filter",
    })
  }
  
  // check sort
  if (!(sortBy in sort_modes)){
    return res.status(422).json({
      error: "Invalid sort method",
    })  
  }
  
  try {
    const count_response = await pool.query(`SELECT COUNT(*) FROM cases`)
    const count = Number(count_response.rows[0].count)
    const last_page = Math.ceil(count / limit)

    const response = await pool.query(`
      SELECT
        cases.*,
        (down_votes + up_votes) AS total_votes,
        users.username,
        users.image_url AS user_image_url,
        ach.name AS flair_name
      FROM cases
      JOIN users
        ON cases.user_id = users.user_id
      LEFT JOIN achievements AS ach
        ON users.flair = ach.achievement_id
      WHERE ${filter_modes[filterBy]}
      ORDER BY ${sort_modes[sortBy]}
      LIMIT $1
      OFFSET $2
      `, [limit, offset])
    const entries = response.rows

    res.status(200).json({
      last_page,
      entries
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const createCase = async (req, res) => {
  try {
    const { object_name, accusation, image } = req.body
    const { user_id } = req.token_payload.user
    const now = new Date();
    const tomorrow = dateWithDelta({days: 1}, now)
    // upload the image
    // console.log(image)
    // console.log(req.body, user_id, now)

    const response = await pool.query(`
      INSERT INTO cases (user_id, created_at, object_name, accusation, image_url, phase_start, phase_end)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING case_id`,
      [user_id, now, object_name, accusation, null, now.toISOString(), tomorrow.toISOString()]
    )

    res.status(201).json({ case_id: response.rows[0].case_id})
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message })
  }
}

const withdrawCase = async (req, res) => {
  try {
    const { id } = req.params
    // Withdraw case (only by case author)
    const now = (new Date()).toISOString();

    const response = await pool.query(`
      UPDATE cases
      SET (phase, phase_start, phase_end) = ($1, $2, $3)
      WHERE case_id = $4`,
      ['WITHDRAWN', now, null, id]
    )

    res.status(204)
  } catch (error) {
    console.log(error.message)
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
    const { targetPhase } = req.body
    const newStart = new Date()
    const newEnd = dateWithDelta({days:1}, newStart)

    const response = await pool.query(`
      UPDATE cases 
      SET (phase, phase_start, phase_end) = ($1, $2, $3)
      WHERE case_id = $4`,
      [targetPhase, newStart, newEnd, id]
    )
    const data = response.rows[0]

    // Update case phase (for rollback or manual advance, only presiding judge can do)
    res.json({ /* updated case */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default { getCases, createCase, withdrawCase, getCase, getCompleteCase, voteCase, voteCountCase, getCaseEvidence, getCaseArguments, getJurySummary, submitRuling, changePhase }
