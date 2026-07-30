import express from 'express'
import multer from 'multer'
import controller from '../controllers/me.js'
import { validateJWT } from '../middleware/jwt.js'
import { validateProfileUpdate } from '../middleware/submissionValidation.js'

const upload = multer({ storage: multer.memoryStorage() })

const router = express.Router()

router.get('/', validateJWT, (req, res) => {
    res.json(req.token_payload);
})
router.patch('/edit', validateJWT, upload.single('image'), validateProfileUpdate, controller.updateUser)
router.get('/usage', validateJWT, controller.getUsage) // user participation for today

// disabled for now, stretch features
// router.delete('', controller.deleteAccount) 
// router.post('/verify-email/:token', controller.verifyEmail)

router.get('/activity', validateJWT, controller.getUserActivity)
// getUserActivity aggregates:
//    me/likes
//    me/jury-assignments
//    users/[user_id]/submissions?type=cases
//    users/[user_id]/submissions?type=evidence
//    users/[user_id]/submissions?type=arguments

router.get('/likes', validateJWT, controller.getUserLikes) // query params ?limit=20&offset=0
router.get('/jury-assignments', validateJWT, controller.getUserJuryAssignments) // query params ?limit=20&offset=0

export default router
