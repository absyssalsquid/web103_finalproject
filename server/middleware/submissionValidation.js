import { pool } from '../config/database.js'
import { DateTime } from "luxon";

import {getRefreshTime} from '../utils/time.js'
import {isDict, compressWhitespace, isNonemptyString, toIntArray} from '../utils/validation.js'
import { USAGE_LIMITS, REFRESH_TIME, LENGTH_LIMITS } from '../config/userRules.js'

const TABLE_MAP = { 'cases': 'cases', 'evidence': 'evidence', 'arguments': 'arguments', 'jury_assignments': 'jury_assignments' } // sql injection guard

async function isBelowSubmissionLimit(user_id, table, usageLimit){
  if (!(table in TABLE_MAP)) 
    return null
  
  try {
    const last_refresh = getRefreshTime(false)
    const count_response = await pool.query(`
      SELECT COUNT(*)
      FROM ${TABLE_MAP[table]}
      WHERE user_id = $1
        AND created_at > $2
    `, [user_id, last_refresh])
    const count = Number(count_response.rows[0].count)
    
    return (count < usageLimit)
  } catch (error){
    return null
  }
}

export const validateCreateUser = (req, res, next) => {
  // validate body and extract params
  if (!isDict(req.body))
    return res.status(400).json({error: 'Request body must be a JSON object.'});

  const { email, username, password, password2 } = req.body;

  if (!isNonemptyString(email) || !isNonemptyString(username) || !isNonemptyString(password))
    return res.status(400).json({error: `email, username, and password are required`});

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
    return res.status(400).json({error: `Invalid email address.`});

  // validate user
  if (!/^[a-zA-Z0-9]+$/.test(username))
    return res.status(400).json({error: `Username must be alphanumeric.`});

  let min_v = LENGTH_LIMITS.username_min
  let max_v = LENGTH_LIMITS.username_max
  if (username.length < min_v || username.length > max_v)
    return res.status(400).json({error: `Username must be between ${min_v} and ${max_v} characters.`});

  // validate password
  if (/\s/.test(password))
    return res.status(400).json({error: `Password cannot contain spaces.`});

  min_v = LENGTH_LIMITS.password_min
  if (password.length < min_v)
    return res.status(400).json({error: `Password must be at least ${min_v} characters.`});

  if (!isNonemptyString(password2))
    return res.status(400).json({error: `Confirm your password.`});

  if (password !== password2)
    return res.status(400).json({error: `Password does not match.`});

  next();
};

export async function validateProfileUpdate(req, res, next){
  // validate body and extract params
  if (!isDict(req.body))
    return res.status(400).json({error: 'Request body must be a JSON object.'});

  const { user_id } = req.token_payload.user
  let { bio, flair } = req.body

  // multipart sends everything as strings; normalize empties to null
  bio = (bio === null || bio === '') ? null : bio
  flair = (flair === null || flair === '') ? null : Number(flair)

  // Validate bio if provided
  if (bio !== null) {
    bio = compressWhitespace(bio, true) // retain multiple spaces

    const max_v = LENGTH_LIMITS.bio_max
    if (bio.length > max_v)
      return res.status(400).json({error: `Bio cannot exceed ${max_v} characters.`});
  }

  // validate that user has achieved flair
  if (flair !== null){

    if (!Number.isSafeInteger(flair) || flair < 1)
      return res.status(400).json({error: 'Invalid flair ID.'});

    try {
      const fl_response = await pool.query(`
        SELECT *
        FROM user_achievements
        WHERE (user_id, achievement_id) = ($1, $2)
          AND earned_at IS NOT NULL
      `, [user_id, flair])
      if (fl_response.rows.length === 0)
        return res.status(401).json({error: `You haven't earned this achievement.`});
    } catch (error) {
      console.log(error.message)
      return res.status(500).json({error: 'Internal server error.'});
    }
  }

  // Attach normalized values to request for controller to use
  req.body.bio = bio
  req.body.flair = flair

  next();
}

export async function validateCaseSubmission(req, res, next) {
  const { user_id } = req.token_payload.user

  // validate body and extract params
  if (!isDict(req.body))
    return res.status(400).json({error: 'Request body must be a JSON object.'});

  let { object_name, accusation } = req.body

  object_name = (object_name === null || object_name === '') ? null : object_name
  accusation = (accusation === null || accusation === '') ? null : accusation

  // validate object name
  if (object_name === null)
    return res.status(400).json({error: 'Object name is required.'});

  if (typeof object_name !== 'string')
    return res.status(400).json({error: 'Object name must be a string.'});

  object_name = compressWhitespace(object_name)
  const objectNameMin = LENGTH_LIMITS.object_name_min
  const objectNameMax = LENGTH_LIMITS.object_name_max
  if (object_name.length < objectNameMin || object_name.length > objectNameMax)
    return res.status(400).json({error: `Object name must be between ${objectNameMin} and ${objectNameMax} characters.`});

  // validate accusation
  if (accusation === null)
    return res.status(400).json({error: 'Accusation is required.'});

  if (typeof accusation !== 'string')
    return res.status(400).json({error: 'Accusation must be a string.'});

  accusation = compressWhitespace(accusation)
  const accusationMin = LENGTH_LIMITS.accusation_min
  const accusationMax = LENGTH_LIMITS.accusation_max
  if (accusation.length < accusationMin || accusation.length > accusationMax)
    return res.status(400).json({error: `Accusation must be between ${accusationMin} and ${accusationMax} characters.`});

  // validate participation limits
  const canSubmit = await isBelowSubmissionLimit(user_id, 'cases', USAGE_LIMITS.cases)
  if (canSubmit === null)
    return res.status(500).json({ error: 'Could not validate usage limits.' })
  if (!canSubmit)
      return res.status(401).json({error: `You have used all of your case submissions for today.`});

  req.body.object_name = object_name
  req.body.accusation = accusation

  next();
}

export async function validateArgumentSubmission(req, res, next) {
  const { user_id } = req.token_payload.user

  // validate body and extract params
  if (!isDict(req.body))
    return res.status(400).json({error: 'Request body must be a JSON object.'});

  let { case_id, text, argument_tag, case_citations, evidence_citations } = req.body
  text = (text === null || text === '') ? null : text
  argument_tag = (argument_tag === null || argument_tag === '') ? null : argument_tag
  case_citations = (case_citations === null) ? [] : case_citations
  evidence_citations = (evidence_citations === null) ? [] : evidence_citations

  // validate case id
  case_id = Number(case_id)
  if (!Number.isSafeInteger(case_id) || case_id < 1)
    return res.status(400).json({error: 'Invalid case ID.'});

  // validate argument tag
  if (argument_tag === null)
    return res.status(400).json({error: 'Argument tag (prosecution or defense) is required.'});

  if (!['PROSECUTION', 'DEFENSE'].includes(argument_tag))
    return res.status(400).json({error: 'Argument tag must be prosecution or defense.'});
  
  // validate argument
  if (text === null)
    return res.status(400).json({error: 'Argument is required.'});

  if (typeof text !== 'string')
    return res.status(400).json({error: 'Argument must be a string.'});

  text = compressWhitespace(text)
  const argumentMin = LENGTH_LIMITS.argument_min
  const argumentMax = LENGTH_LIMITS.argument_max
  if (text.length < argumentMin || text.length > argumentMax) 
    return res.status(400).json({error: `Argument must be between ${argumentMin} and ${argumentMax} characters.`});

  // validate evidence citations formatting
  let success = toIntArray(evidence_citations)
  if (!success)
      return res.status(400).json({error: 'Selected evidence citations not recognized.'});

  // validate case citations formatting
  success = toIntArray(case_citations)
  if (!success)
      return res.status(400).json({error: 'Selected case citations not recognized.'});
  
  // validate participation limits
  const canSubmit = await isBelowSubmissionLimit(user_id, 'arguments', USAGE_LIMITS.arguments)
  if (canSubmit === null)
    return res.status(500).json({ error: 'Could not validate usage limits.' })
  if (!canSubmit)
      return res.status(401).json({error: `You have used all of your argument submissions for today.`});
    
  try {
    // validate phase
    const response = await pool.query(`
      SELECT
        phase,
        phase_end
      FROM cases
      WHERE case_id = $1`,
      [case_id])

    if (response.rows.length === 0) {
      return res.status(404).json({error: 'Case not found.'});
    }

    const { phase, phase_end } = response.rows[0]
    if (phase_end === null) 
      return res.status(400).json({error: 'Case is not eligible for argument submissions.'});
    
    if (phase !== 'ARGUMENT') 
      return res.status(400).json({error: 'Arguments can only be submitted during the argument phase.'});
    
    if (DateTime.now() > new DateTime(phase_end)) 
      return res.status(400).json({error: 'Argument phase has ended.'});
    
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({error: 'Internal server error.'});
  }

  // TODO: validate case_citations, evidence_citations exist

  req.body = { case_id, text, argument_tag, case_citations, evidence_citations }

  next();
}

export function createArgumentSubmissionValidator(query = pool.query.bind(pool)) {
  // for testing
  return validateArgumentSubmission;
}

export async function validateEvidenceSubmission(req, res, next) {
  const { user_id } = req.token_payload.user

  // validate body and extract params
  if (!isDict(req.body))
    return res.status(400).json({error: 'Request body must be a JSON object.'});

  let { case_id, text } = req.body
  text = (text === null || text === '') ? null : text

  // validate case id
  case_id = Number(case_id)
  if (!Number.isSafeInteger(case_id) || case_id < 1)
    return res.status(400).json({error: 'Invalid case ID.'});

  // validate text
  if (text === null)
      return res.status(400).json({error: 'Evidence is required.'});

  if (typeof text !== 'string') 
    return res.status(400).json({error: 'Evidence must be a string.'});

  text = compressWhitespace(text)
  let min_v = LENGTH_LIMITS.evidence_min
  let max_v = LENGTH_LIMITS.evidence_max
  if (text.length < min_v || text.length > max_v) 
    return res.status(400).json({error: `Evidence must be between ${min_v} and ${max_v} characters.`});
  
  // validate participation limits
  const canSubmit = await isBelowSubmissionLimit(user_id, 'evidence', USAGE_LIMITS.evidence)
  if (canSubmit === null)
    return res.status(500).json({ error: 'Could not validate usage limits.' })
  if (!canSubmit)
      return res.status(401).json({error: `You have used all of your evidence submissions for today.`});
    
  try{
    // validate phase
    const q_response = await pool.query(`
      SELECT phase, phase_end
      FROM cases
      WHERE case_id = $1`,
      [case_id])

    if (q_response.rows.length === 0) 
      return res.status(404).json({error: `Case not found.`});

    const {phase, phase_end} = q_response.rows[0]
    if (phase_end === null) 
      return res.status(400).json({error: 'Case is not eligible for evidence submissions.'});
      
    if (phase !== 'DISCOVERY')
      return res.status(401).json({error: `Evidence can only be submitted during the discovery phase.`});

    if (DateTime.now() > new DateTime(phase_end))
      return res.status(401).json({error: `Discovery phase has ended.`});

  } catch (error) {
    console.log("validateEvidenceSubmission", error.message)
    return res.status(500).json({ error: error.message })
  }

  req.body.case_id = case_id
  req.body.text = text

  next();
}

export async function validateBallotSubmission(req, res, next) {
  const { user_id } = req.token_payload.user
  let { assignment_id } = req.params
  let { vote, fav_args } = req.body
  fav_args = (fav_args === null) ? [] : fav_args

  // don't check for participation, was already checked when ballot was assigned

  // validate assignment id
  assignment_id = Number(assignment_id)
  if (!Number.isSafeInteger(assignment_id) || assignment_id < 1)
    return res.status(400).json({error: 'Invalid assignment.'});

  // validate vote, allow retracting vote
  if (!['GUILTY','NOT_GUILTY', null].includes(vote))
    return res.status(400).json({error: 'Invalid vote.'});

  // validate fav args
  let success = toIntArray(fav_args)
  if (!success)
      return res.status(400).json({error: 'Selected arguments not recognized.'});

  try{
    const response = await pool.query(`
      SELECT * FROM jury_assignments
      WHERE (id, user_id) = ($1, $2)`,
      [assignment_id, user_id])

    // validate assignment to user
    if (response.rows.length === 0) 
      return res.status(400).json({error: "You are not part of this jury pool."})
    
    // validate phase
    const {expires_at} = response.rows[0]
    if (DateTime.now() > new DateTime(expires_at)) 
      return res.status(400).json({error: `Jury is no longer in session.`});

    // check that fav_args exist and belong to case
    if (fav_args.length > 0){
      const { case_id } = response.rows[0]
      const arg_response = await pool.query(`
        SELECT COUNT(*)
        FROM arguments
        WHERE arg_id = ANY($1) AND case_id = $2
      `, [fav_args, case_id])
      const count = Number(arg_response.rows[0].count)
      if (count !== fav_args.length)
        return res.status(400).json({error: `Selected arguments do not exist, or do not belong to this case.`});
    }

  } catch (error) {
    console.log("validateBallotSubmission", error.message)
    return res.status(500).json({error: `Internal server error.`});
  }

  req.body.fav_args = fav_args

  next();
}

export async function validateJurorAssignment(req, res, next) {
  const { user_id } = req.token_payload.user

  // validate participation limits
  const canSubmit = await isBelowSubmissionLimit(user_id, 'jury_assignments', USAGE_LIMITS.jury_assignments)
  if (canSubmit === null)
    return res.status(500).json({ error: 'Could not validate usage limits.' })
  if (!canSubmit)
      return res.status(401).json({error: `You have used all of your jury summons for today.`});
  
  next();
}
