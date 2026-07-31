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

export function validateProfileUpdate(req, res, next){
  let { bio, flair } = req.body

  // multipart sends everything as strings; normalize empties to null
  bio = (bio == null || bio === '') ? null : bio
  flair = (flair == null || flair === '') ? null : Number(flair)

  // Validate bio if provided
  if (bio != null) {
    // Compress newlines into single space. retain multiple spaces
    console.log(bio)
    bio = bio.replace(/[\r\n]+/g, ' ').trim()
    console.log(bio)

    // Check length
    const max_v = LENGTH_LIMITS.bio_max
    if (bio.length > max_v) {
      return res.status(400).json({
        error: `Bio must not exceed ${max_v} characters.`
      });
    }
  }

  // Attach normalized values to request for controller to use
  req.body.bio = bio
  req.body.flair = flair

  next();
}

export function validateCaseSubmission(req, res, next) {
  const { object_name, accusation } = req.body ?? {}

  if (object_name == null || object_name === '') {
    return res.status(400).json({
      error: 'Object name is required.'
    });
  }
  if (typeof object_name !== 'string') {
    return res.status(400).json({
      error: 'Object name must be a string.'
    });
  }

  const trimmedObjectName = object_name.trim()
  if (trimmedObjectName.length === 0) {
    return res.status(400).json({
      error: 'Object name is required.'
    });
  }

  const objectNameMin = LENGTH_LIMITS.object_name_min
  const objectNameMax = LENGTH_LIMITS.object_name_max
  if (trimmedObjectName.length < objectNameMin || trimmedObjectName.length > objectNameMax) {
    return res.status(400).json({
      error: `Object name must be between ${objectNameMin} and ${objectNameMax} characters.`
    });
  }

  if (accusation == null || accusation === '') {
    return res.status(400).json({
      error: 'Accusation is required.'
    });
  }
  if (typeof accusation !== 'string') {
    return res.status(400).json({
      error: 'Accusation must be a string.'
    });
  }

  const trimmedAccusation = accusation.trim()
  if (trimmedAccusation.length === 0) {
    return res.status(400).json({
      error: 'Accusation is required.'
    });
  }

  const accusationMin = LENGTH_LIMITS.accusation_min
  const accusationMax = LENGTH_LIMITS.accusation_max
  if (trimmedAccusation.length < accusationMin || trimmedAccusation.length > accusationMax) {
    return res.status(400).json({
      error: `Accusation must be between ${accusationMin} and ${accusationMax} characters.`
    });
  }

  req.body.object_name = trimmedObjectName
  req.body.accusation = trimmedAccusation

  next();
}

const INELIGIBLE_ARGUMENT_PHASES = new Set(['WITHDRAWN', 'DISMISSED', 'CLOSED'])

export function createArgumentSubmissionValidator(query = pool.query.bind(pool)) {
  return async function validateArgumentSubmission(req, res, next) {
    const body = req.body

    if (body == null || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        error: 'Request body must be a JSON object.'
      });
    }

    const suppliedCaseId = body.caseId ?? body.id
    if (suppliedCaseId == null || suppliedCaseId === '') {
      return res.status(400).json({
        error: 'Case ID is required.'
      });
    }

    let caseId = suppliedCaseId
    if (typeof suppliedCaseId === 'string') {
      const trimmedCaseId = suppliedCaseId.trim()
      if (trimmedCaseId.length === 0) {
        return res.status(400).json({
          error: 'Case ID is required.'
        });
      }
      if (!/^\d+$/.test(trimmedCaseId)) {
        return res.status(400).json({
          error: 'Case ID must be a positive integer.'
        });
      }
      caseId = Number(trimmedCaseId)
    }

    if (!Number.isSafeInteger(caseId) || caseId <= 0) {
      return res.status(400).json({
        error: 'Case ID must be a positive integer.'
      });
    }

    const { content } = body
    if (content == null || content === '') {
      return res.status(400).json({
        error: 'Argument content is required.'
      });
    }
    if (typeof content !== 'string') {
      return res.status(400).json({
        error: 'Argument content must be a string.'
      });
    }

    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      return res.status(400).json({
        error: 'Argument content is required.'
      });
    }

    const argumentMin = LENGTH_LIMITS.argument_min
    const argumentMax = LENGTH_LIMITS.argument_max
    if (trimmedContent.length < argumentMin || trimmedContent.length > argumentMax) {
      return res.status(400).json({
        error: `Argument must be between ${argumentMin} and ${argumentMax} characters.`
      });
    }

    body.caseId = caseId
    body.content = trimmedContent

    try {
      const response = await query(`
        SELECT
          phase,
          phase_end,
          (phase_end IS NOT NULL AND phase_end > NOW()) AS argument_deadline_active
        FROM cases
        WHERE case_id = $1`,
        [caseId])

      if (response.rows.length === 0) {
        return res.status(404).json({
          error: 'Case not found.'
        });
      }

      const { phase, phase_end, argument_deadline_active } = response.rows[0]
      if (INELIGIBLE_ARGUMENT_PHASES.has(phase)) {
        return res.status(400).json({
          error: 'Case is not eligible for argument submissions.'
        });
      }
      if (phase !== 'ARGUMENT') {
        return res.status(400).json({
          error: 'Arguments can only be submitted during the argument phase.'
        });
      }
      if (phase_end == null) {
        return res.status(400).json({
          error: 'Case is not eligible for argument submissions.'
        });
      }
      if (!argument_deadline_active) {
        return res.status(400).json({
          error: 'Argument phase has ended.'
        });
      }
    } catch (error) {
      console.log(error.message)
      return res.status(500).json({
        error: 'Internal server error.'
      });
    }

    next();
  }
}

export const validateArgumentSubmission = createArgumentSubmissionValidator()

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
