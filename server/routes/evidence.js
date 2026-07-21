import express from 'express'
import controller from '../controllers/evidence.js'

const router = express.Router()

router.post('/', controller.createEvidence)  // body: { caseId, content, ... }
router.get('/:id', controller.getEvidence)
router.delete('/:id', controller.deleteEvidence) // Users CANNOT delete once evidence phase has passed

router.put('/:id/vote', controller.voteEvidence)  // Users CANNOT vote once evidence phase has passed
router.delete('/:id/vote', controller.deleteVote) // Users CANNOT delete votes once evidence phase has passed
router.get('/:id/votes', controller.voteCountEvidence)

export default router
