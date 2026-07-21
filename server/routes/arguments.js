import express from 'express'
import controller from '../controllers/arguments.js'

const router = express.Router()

router.post('/', controller.createArgument)  // body: { caseId, content, ... }
router.get('/:id', controller.getArgument)
router.delete('/:id', controller.deleteArgument) // Users CANNOT delete once argument phase has passed

router.put('/:id/vote', controller.voteArgument) // Users CANNOT vote once argument phase has passed
router.delete('/:id/vote', controller.deleteVote) // Users CANNOT delete votes once argument phase has passed
router.get('/:id/votes', controller.voteCountArgument)

export default router
