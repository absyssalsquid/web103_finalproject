import { pool } from '../config/database.js'
import { getRandomInt } from '../utils/time.js'

const assignCase = async (req, res) => {
  const { user_id } = req.token_payload.user

  try {
    // Auto-assign user to random eligible case with >2hrs remaining in jury phase
    const cases_response = await pool.query(`
      SELECT c.case_id, c.phase_end
      FROM cases AS c
      WHERE c.phase = 'JURY_DELIBERATION'
        AND c.user_id <> $1
        AND c.phase_end >= NOW() + INTERVAL '2 hours'
        AND NOT EXISTS (
          SELECT 1
          FROM jury_assignments AS ja
          WHERE ja.case_id = c.case_id
            AND ja.user_id = $1
        )
      `, [user_id])

    const eligible_cases = cases_response.rows
    if (eligible_cases.length === 0){
      return res.status(200).json({
        ja_id: null,
        case_id: null,
        message: 'No eligible cases available.'
      })
    }
    const idx = getRandomInt(0, eligible_cases.length-1)
    const {case_id, phase_end} = eligible_cases[idx]
    // console.log(`assignCase. N=${eligible_cases.length}, i=${idx} --> case #${case_id}`, )

    const ja_response = await pool.query(`
      INSERT INTO jury_assignments (case_id, user_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id`,
      [case_id, user_id, phase_end]
    )

    res.status(201).json({
      ja_id: ja_response.rows[0].id,
      case_id
    })
  } catch (error) {
    console.log("assignCase err", error.message)
    res.status(500).json({ error: error.message })
  }
}

const getAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params
    const { user_id } = req.token_payload.user
    // Get specific jury assignment details
    // get current vote and selected arguments
    const response = await pool.query(`
      SELECT * FROM jury_assignments
      WHERE id = $1`,
      [assignment_id])
    const data = response.rows

    if (data.length === 0) 
      return res.status(404).json({error: "Assignment not found."})
    if (data[0].user_id != user_id)
      return res.status(401).json({error: "This is not your assignment."})
    else 
      return res.status(200).json({
        case_id: data[0].case_id,
        vote: data[0].vote,
        persuasive_args: [] // later add the currently saved persuasive arguments
      })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const castBallot = async (req, res) => {
  try {
    const { assignment_id } = req.params
    const { verdict, bestArgumentIds } = req.body
    // Submit jury verdict and best arguments (only during jury phase)
    // Delete previously voted best arguments from jury_arg_refs before adding new ones
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default { assignCase, getAssignment, castBallot }
