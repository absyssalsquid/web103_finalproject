import { pool } from '../config/database.js'
import jwt from 'jsonwebtoken'

import {newToken, TOKEN_COOKIE_OPTIONS} from '../utils/jwt.js'


const updateUser = async (req, res) => {
  const { user_id } = req.token_payload.user
  const { bio, flair } = req.body

  // TODO: image uploads — req.file holds the new avatar once storage is wired up

  try {
    // a user may only flair an achievement they've actually earned
    if (flair != null) {
      const owned = await pool.query(`
        SELECT 1 FROM user_achievements
        WHERE user_id = $1 AND achievement_id = $2 AND earned_at IS NOT NULL`,
        [user_id, flair])

      if (owned.rows.length === 0)
        return res.status(400).json({ error: 'You have not earned that achievement.' })
    }

    const response = await pool.query(`
      UPDATE users
      SET bio = $1, flair = $2
      WHERE user_id = $3
      RETURNING user_id, username, image_url, bio, flair, created_at`,
      [bio, flair, user_id])
    if (response.rows.length === 0)
      return res.status(404).json({ error: 'user not found!' })

    res.status(200).json(response.rows[0])
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

const getUsage = async (req, res) => {
  const {user_id} = req.token_payload.user
  try {
    // Get current user's usage for today
    // count number of each done since 8am pst
    const conditions = `user_id = $1 AND created_at >= NOW() AT TIME ZONE 'PST8PDT' - INTERVAL '1 day' + INTERVAL '8 hours'`
    const response = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM cases            WHERE ${conditions}) as cases,
        (SELECT COUNT(*) FROM jury_assignments WHERE ${conditions}) as jury_assignments,
        (SELECT COUNT(*) FROM evidence         WHERE ${conditions}) as evidence,
        (SELECT COUNT(*) FROM arguments        WHERE ${conditions}) as arguments
    `, [user_id])

    let usage = response.rows[0]
    for (const [key, val] of Object.entries(usage) ){
      usage[key] = Number(val)
    }

    res.json(usage)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getUserActivity = async (req, res) => {
  try {
    // Get aggregated activity: likes, jury assignments, submissions
    res.json({ /* activity data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getUserLikes = async (req, res) => {
  try {
    // Get user's votes (?limit=20&offset=0)
    res.json({ /* likes data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getUserJuryAssignments = async (req, res) => {
  const {user_id} = req.token_payload.user
  let {page, limit} = req.query
  page = Number(page)
  limit = Number(limit)
  const offset = (page-1) * limit;
  // console.log(`page: ${page}, limit: ${limit}, offset: ${offset}`)

  try {
    // Get user's jury assignments (?limit=20&offset=0)

    const count_response = await pool.query(`
      SELECT COUNT(*) FROM jury_assignments
      WHERE user_id = $1`,
      [user_id])
    const count = Number(count_response.rows[0].count)
    const last_page = Math.ceil(count / limit)
    // console.log(count_response.rows, count, last_page)

    const response = await pool.query(`
      SELECT * FROM jury_assignments
      WHERE user_id = $1
      LIMIT $2
      OFFSET $3`, 
      [user_id, limit, offset])

    // console.log(response.rows)

    res.status(200).json({ 
      last_page: last_page || 1,
      entries: response.rows 
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

export default { updateUser, getUsage, getUserActivity, getUserLikes, getUserJuryAssignments }
