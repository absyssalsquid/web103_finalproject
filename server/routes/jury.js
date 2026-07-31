import express from 'express'
import controller from '../controllers/juryDuty.js'
import { validateJWT } from '../middleware/jwt.js'
import { validateBallotSubmission, validateJurorAssignment } from '../middleware/submissionValidation.js'

const router = express.Router()

router.post('/serve', validateJWT, validateJurorAssignment, controller.assignCase) // assigns user to a random eligible case. case should have >2hrs remaining in jury phase
router.get('/:assignment_id', validateJWT, controller.getAssignment) // RESTRICTED; get assignment details
router.patch('/:assignment_id', validateJWT, validateBallotSubmission, controller.castBallot) // body: { vote, bestArgumentIds: [] }
// users cannot change vote once jury phase has passed
// make sure to delete previously voted best arguments from jury_arg_refs

export default router