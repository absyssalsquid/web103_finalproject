import express from 'express'
import controller from '../controllers/evidence.js'

import { requireJWT } from '../middleware/jwt.js'
import { validateEvidenceSubmission } from '../middleware/submissionValidation.js'

const router = express.Router()

router.post('/', requireJWT, validateEvidenceSubmission, controller.createEvidence)  // body: { caseId, content, ... }
router.get('/:id', controller.getEvidence)
router.delete('/:id', requireJWT, controller.deleteEvidence) // Users CANNOT delete once evidence phase has passed

router.put('/:id/vote', requireJWT, controller.voteEvidence)  // Users CANNOT vote once evidence phase has passed
router.get('/:id/votes', controller.voteCountEvidence)

export default router
