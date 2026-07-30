import { pool } from '../config/database.js'

const getUser = async (req, res) => {
  try {
    const { user_id } = req.params
    // Get user profile card data (public)

    const response = await pool.query(`
      SELECT 
        users.user_id, users.username, users.image_url, users.bio, users.created_at,
        ach.name AS flair_name
      FROM users
      LEFT JOIN achievements AS ach
        ON users.flair = ach.achievement_id
      WHERE user_id = $1`, 
      [user_id])

    if (response.rows.length === 0)
      return res.status(404).json({error: 'user not found!'})
    
    res.status(200).json(response.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getUserStats = async (req, res) => {
  // Get user stats (XP, contributions, etc.)
  try {
    const { user_id } = req.params

    const conditions = `user_id = $1`
    const response = await pool.query(`
      SELECT
        (SELECT total_xp FROM users            WHERE ${conditions}) as total_xp,
        (SELECT COUNT(*) FROM cases            WHERE ${conditions}) as cases,
        (SELECT COUNT(*) FROM jury_assignments WHERE ${conditions}) as jury_assignments,
        (SELECT COUNT(*) FROM evidence         WHERE ${conditions}) as evidence,
        (SELECT COUNT(*) FROM arguments        WHERE ${conditions}) as arguments
    `, [user_id])

    let stats = response.rows[0]
    for (const [key, val] of Object.entries(stats) ){
      stats[key] = Number(val)
    }

    res.status(200).json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getUserAchievements = async (req, res) => {
  // Get user's earned and in-progress achievements
  try {
    const { user_id } = req.params
    const response = await pool.query(`
      SELECT 
        u_ach.*,
        ach.*
      FROM user_achievements AS u_ach
      JOIN achievements AS ach
        ON u_ach.achievement_id = ach.achievement_id
      WHERE u_ach.user_id = $1
      `, [user_id])
    res.status(200).json(response.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getUserSubmissions = async (req, res) => {
  try {
    const { user_id } = req.params
    const { type, limit, offset } = req.query
    // Get user submissions (?limit=20&offset=0&type=cases|evidence|arguments|all)
    res.json({ /* submissions data */ })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Shared by PATCH /users/:id and PATCH /me/edit (see server/controllers/me.js).
// Ownership is already enforced by the calling route (requireOwnUser for
// :id, or implicitly via the token for /me/edit), and the request body is
// already validated (validateProfileUpdate) before this runs.
export const updateUser = async (req, res) => {
  try {
    const targetId = req.params.id ?? req.token_payload.user.user_id
    const body = req.body

    const setClauses = []
    const values = []

    if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
      values.push(body.bio === '' ? null : body.bio)
      setClauses.push(`bio = $${values.length}`)
    }

    if (Object.prototype.hasOwnProperty.call(body, 'image_url')) {
      values.push(body.image_url === '' ? null : body.image_url)
      setClauses.push(`image_url = $${values.length}`)
    }

    values.push(targetId)

    const response = await pool.query(`
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE user_id = $${values.length}
      RETURNING user_id, username, email, image_url, bio, total_xp, created_at, flair`,
      values)

    if (response.rows.length === 0)
      return res.status(404).json({ error: 'user not found!' })

    res.status(200).json(response.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default { getUser, getUserStats, getUserAchievements, getUserSubmissions, updateUser }
