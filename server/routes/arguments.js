import express from 'express'
import controller from '../controllers/arguments.js'
import { requireJWT } from '../middleware/jwt.js'
import { validateArgumentSubmission, normalizeArgumentSubmission } from '../middleware/submissionValidation.js'

const router = express.Router()

// legacy/compatibility route — accepts the currently-deployed frontend's
// { id, content, case_ids, evidence_ids } body via normalizeArgumentSubmission
router.post('/', requireJWT, normalizeArgumentSubmission, validateArgumentSubmission, controller.createArgument)
router.patch('/:id', requireJWT, validateArgumentSubmission, controller.updateArgument) // Users CANNOT edit after 5 minues 
router.delete('/:id', requireJWT, controller.deleteArgument) // Users CANNOT delete once argument phase has passed
router.get('/:id', controller.getArgument)

router.put('/:id/vote', requireJWT, controller.voteArgument) // Users CANNOT vote/or change once argument phase has passed
router.get('/:id/votes', controller.voteCountArgument)

export default router
