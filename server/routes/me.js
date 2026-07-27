import express from 'express'
import controller from '../controllers/me.js'

import { validateJWT } from '../utils/jwt.js'

const router = express.Router()

// RESTRICTED: some endpoints require authentication
// ensure that request has token/session matching body: user_id
// ***all*** PUT, POST, AND DELETE requests are RESTRICTED
// only GET endpoints are marked

router.get('/', validateJWT, (req, res) => {
    res.json(req.user);
})
router.patch('/edit', controller.updateUser)
router.get('/limits', controller.getLimits) // user participation for today

// disabled for now, stretch features
// router.delete('', controller.deleteAccount) 
// router.post('/verify-email/:token', controller.verifyEmail)

router.get('/activity', controller.getUserActivity)
// getUserActivity aggregates:
//    me/likes
//    me/jury-assignments
//    users/[user_id]/submissions?type=cases
//    users/[user_id]/submissions?type=evidence
//    users/[user_id]/submissions?type=arguments

router.get('/likes', controller.getUserLikes) // query params ?limit=20&offset=0
router.get('/jury-assignments', controller.getUserJuryAssignments) // query params ?limit=20&offset=0

export default router
