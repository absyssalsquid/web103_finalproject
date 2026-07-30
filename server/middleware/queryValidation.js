import { pool } from '../config/database.js'

import { CASE_FILTER_MODES, CASE_SORT_MODES, EV_ARG_SORT_MODES } from '../config/queryOptions.js'

export function validateQueryPageLimit(req, res, next){
  let { limit, page } = req.query
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

  next()
}


export function validateCaseQuery(req, res, next) {
  let { filterBy, sortBy } = req.query

  // check filter
  if (!(filterBy in CASE_FILTER_MODES)){
    return res.status(422).json({
      error: "Invalid status filter",
    })
  }
  
  // check sort
  if (!(sortBy in CASE_SORT_MODES)){
    return res.status(422).json({
      error: "Invalid sort method",
    })  
  }
  next()
}


export function validateEvidenceQuery(req, res, next) {
  let { sortBy } = req.query
  
  // check sort
  if (!(sortBy in EV_ARG_SORT_MODES)){
    return res.status(422).json({
      error: "Invalid sort method",
    })  
  }
  next()
}

export function validateArgumentQuery(req, res, next) {
  let { filterBy, sortBy } = req.query

  // check filter
  if (!(filterBy in ARGUMENT_FILTER_MODES)){
    return res.status(422).json({
      error: "Invalid status filter",
    })
  }
  
  // check sort
  if (!(sortBy in EV_ARG_SORT_MODES)){
    return res.status(422).json({
      error: "Invalid sort method",
    })  
  }
  next()
}