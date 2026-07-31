import express from 'express'
import controller from '../controllers/auth.js'

import { validateCreateUser } from '../middleware/submissionValidation.js'
import { validateJWT } from '../middleware/jwt.js'

const router = express.Router()

// RESTRICTED: some endpoints require authentication
// ensure that request has token/session matching body: user_id
// ***all*** PUT, POST, AND DELETE requests are RESTRICTED
// only GET endpoints are marked

router.post('/register', validateCreateUser, controller.createUser)
router.post('/login', controller.login)
router.post('/logout', validateJWT, controller.logout)

export default router
