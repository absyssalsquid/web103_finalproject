import express from 'express'
import controller from '../controllers/auth.js'

const router = express.Router()

// RESTRICTED: some endpoints require authentication
// ensure that request has token/session matching body: user_id
// ***all*** PUT, POST, AND DELETE requests are RESTRICTED
// only GET endpoints are marked

router.post('/register', controller.createUser)
router.post('/login', controller.login)
router.post('/logout', controller.logout)

router.get('/me', controller.getUserFromCreds)
router.patch('/me', controller.updateUser)
router.get('/me/limits', controller.getLimits) // user participation for today

// disabled for now, stretch features
// router.delete('/me', controller.deleteAccount) 
// router.post('/verify-email/:token', controller.verifyEmail)

router.get('/me/activity', controller.getUserActivity)
// getUserActivity aggregates:
//    me/likes
//    me/jury-assignments
//    users/[user_id]/submissions?type=cases
//    users/[user_id]/submissions?type=evidence
//    users/[user_id]/submissions?type=arguments

router.get('/me/likes', controller.getUserLikes) // query params ?limit=20&offset=0
router.get('/me/jury-assignments', controller.getUserJuryAssignments) // query params ?limit=20&offset=0

export default router
