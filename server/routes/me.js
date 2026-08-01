import express from 'express'
import multer from 'multer'
import controller from '../controllers/me.js'

import { requireJWT } from '../middleware/jwt.js'
import { validateQueryPageLimit } from '../middleware/queryValidation.js'
import { validateProfileUpdate } from '../middleware/submissionValidation.js'


const upload = multer({ storage: multer.memoryStorage() })

const router = express.Router()

router.get('/', requireJWT, (req, res) => {
    res.json(req.token_payload);
})
router.patch('/edit', requireJWT, upload.single('image'), validateProfileUpdate, controller.updateUser)
router.get('/usage', requireJWT, controller.getUsage) // user participation for today

// disabled for now, stretch features
// router.delete('', controller.deleteAccount) 
// router.post('/verify-email/:token', controller.verifyEmail)

router.get('/activity/cases', requireJWT, validateQueryPageLimit, controller.getUserCases)
router.get('/activity/evidence', requireJWT, validateQueryPageLimit, controller.getUserEvidence)
router.get('/activity/arguments', requireJWT, validateQueryPageLimit, controller.getUserArguments)

router.get('/likes', requireJWT, controller.getUserLikes) // query params ?limit=20&page=1
router.get('/jury-assignments', requireJWT, controller.getUserJuryAssignments) // query params ?limit=20&page=1

export default router
