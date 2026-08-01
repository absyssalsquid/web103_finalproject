import { pool } from '../config/database.js'

import { CASE_FILTER_MODES, CASE_SORT_MODES, EV_ARG_SORT_MODES, ARGUMENT_FILTER_MODES } from '../config/queryOptions.js'

export function validateQueryPageLimit(req, res, next){
  let { limit, page } = req.query

  limit = Number(limit)
  if (!Number.isSafeInteger(limit) || limit < 5 || limit > 50)
    return res.status(422).json({error: "Requested number of results must be between 5 and 50."})

  page = Number(page)
  if (!Number.isSafeInteger(page) || page < 1 )
    return res.status(422).json({error: "Invalid page num"})

  next()
}


export function validateCaseQuery(req, res, next) {
  let { filterBy, sortBy } = req.query
  if (sortBy === null|| sortBy === undefined) sortBy = 'newest'
  if (filterBy === null || filterBy === undefined) filterBy = 'ALL'

  // check filter
  if (!(filterBy in CASE_FILTER_MODES))
    return res.status(422).json({error: "Invalid status filter"})
  
  // check sort
  if (!(sortBy in CASE_SORT_MODES))
    return res.status(422).json({error: "Invalid sort method"})

  req.validatedQuery = { filterBy, sortBy }
  next()
}

export function validateEvidenceQuery(req, res, next) {
  let { sortBy } = req.query
  if (sortBy === null|| sortBy === undefined) sortBy = 'best'

  // check sort
  if (!(sortBy in EV_ARG_SORT_MODES))
    return res.status(422).json({error: "Invalid sort method"})

  req.validatedQuery = { sortBy }
  next()
}

export function validateArgumentQuery(req, res, next) {
  let { filterBy, sortBy } = req.query
  if (sortBy === null|| sortBy === undefined) sortBy = 'best'
  if (filterBy === null || filterBy === undefined) filterBy = 'all'

  // check filter
  if (!(filterBy in ARGUMENT_FILTER_MODES))
    return res.status(422).json({error: "Invalid status filter"})
  
  // check sort
  if (!(sortBy in EV_ARG_SORT_MODES))
    return res.status(422).json({error: "Invalid sort method"})  
  
  req.validatedQuery = { filterBy, sortBy }
  next()
}

export function validateReaction(req, rex, next){
  const { user_id } = req.token_payload.user
  let { submission_type, submission_id, reaction } = req.body;

  submission_id = Number(submission_id);
  if (!Number.isSafeInteger(submission_id) || submission_id < 1)
      return {status: 422, message: 'Invalid submission id' }

  user_id = Number(user_id);
  if (!Number.isSafeInteger(user_id) || user_id < 1)
      return {status: 422, message: 'Invalid user id' }
      
  const entity = config[submission_type];
  if (!entity) 
      return {status: 422, message: 'Invalid submission type' }
  const { table, idColumn } = entity;

  if (![UP, DOWN, null].includes(reaction)) 
      return {status: 422, message: 'Reaction must be UP, DOWN, or null' }
}