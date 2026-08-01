import express from 'express'
import controller from '../controllers/arguments.js'
import { requireJWT } from '../middleware/jwt.js'
import { validateArgumentSubmission } from '../middleware/submissionValidation.js'

const router = express.Router()

router.post('/', requireJWT, validateArgumentSubmission, controller.createArgument)  // body: { caseId, content, ... }
router.get('/:id', controller.getArgument)
router.delete('/:id', requireJWT, controller.deleteArgument) // Users CANNOT delete once argument phase has passed

router.put('/:id/vote', requireJWT, controller.voteArgument) // Users CANNOT vote/or change once argument phase has passed
router.get('/:id/votes', controller.voteCountArgument)

export default router
