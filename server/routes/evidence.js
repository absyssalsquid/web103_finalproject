import express from 'express'
import controller from '../controllers/evidence.js'

import { validateJWT } from '../middleware/jwt.js'
import { validateEvidenceSubmission } from '../middleware/submissionValidation.js'

const router = express.Router()

router.post('/', validateJWT, validateEvidenceSubmission, controller.createEvidence)  // body: { caseId, content, ... }
router.get('/:id', controller.getEvidence)
router.delete('/:id', validateJWT, controller.deleteEvidence) // Users CANNOT delete once evidence phase has passed

router.put('/:id/vote', validateJWT, controller.voteEvidence)  // Users CANNOT vote once evidence phase has passed
router.get('/:id/votes', controller.voteCountEvidence)

export default router
