import { pool } from '../config/database.js'
import { DateTime } from "luxon";

import { USAGE_LIMITS, REFRESH_TIME, LENGTH_LIMITS } from '../config/userRules.js'

export const validateCreateUser = (req, res, next) => {
  const { email, username, password, password2 } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({
      error: `email, username, and password are required`
    });
  }

  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return res.status(400).json({
      error: `Username must be alphanumeric.`
    });
  }

  if (/\s/.test(password)) {
    return res.status(400).json({
      error: `Password cannot contain spaces.`
    });
  }

  let min_v = LENGTH_LIMITS.username_min
  let max_v = LENGTH_LIMITS.username_max
  if (username.length < min_v || username.length > max_v) {
    return res.status(400).json({
      error: `Username must be between ${min_v} and ${max_v} characters.`
    });
  }

  min_v = LENGTH_LIMITS.password_min
  if (password.length < min_v) {
    return res.status(400).json({
      error: `Password must be at least ${min_v} characters.`
    });
  }

  if (password != password2) {
    return res.status(400).json({
      error: `Password does not match.`
    });
  }

  next();
};

export function validateCaseSubmission(req, res, next) {
  const { object_name, accusation, image} = req.body

  let min_v = LENGTH_LIMITS.object_name_min
  let max_v = LENGTH_LIMITS.object_name_max
  if (object_name.length < min_v || object_name.length > max_v) {
    return res.status(400).json({
      error: `Object name must be between ${min_v} and ${max_v} characters.`
    });
  }

  min_v = LENGTH_LIMITS.accusation_min
  max_v = LENGTH_LIMITS.accusation_max
  if (accusation.length < min_v || accusation.length > max_v) {
    return res.status(400).json({
      error: `Accusation must be between ${min_v} and ${max_v} characters.`
    });
  }
  next();
}

export async function validateEvidenceSubmission(req, res, next) {
  try{
    const { case_id, text } = req.body

    let min_v = LENGTH_LIMITS.evidence_min
    let max_v = LENGTH_LIMITS.evidence_max
    if (text.length < min_v || text.length > max_v) {
      return res.status(400).json({
        error: `Evidence must be between ${min_v} and ${max_v} characters.`
      });
    }

    const q_response = await pool.query(`
      SELECT phase, phase_end
      FROM cases
      WHERE case_id = $1`,
      [case_id])


    if (q_response.rows.length != 1) {
      return res.status(400).json({
        error: `Case not found.`
      });
    }

    const {phase, phase_end} = q_response.rows[0]
    if (phase != 'DISCOVERY' || DateTime.now() > new DateTime(phase_end)) {
      return res.status(400).json({
        error: `Evidence can only be submitted during discovery phase.`
      });
    }

  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }

  next();
}
