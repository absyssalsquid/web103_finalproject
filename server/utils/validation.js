import { FILTER_MODES, SORT_MODES } from '../config/queryOptions.js'
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

export function validateCaseQuery(req, res, next) {
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


  // check filter
  if (!(filterBy in FILTER_MODES)){
    return res.status(422).json({
      error: "Invalid status filter",
    })
  }
  
  // check sort
  if (!(sortBy in SORT_MODES)){
    return res.status(422).json({
      error: "Invalid sort method",
    })  
  }
  next()
}
