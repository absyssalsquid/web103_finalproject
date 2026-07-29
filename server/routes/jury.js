import express from 'express'
import controller from '../controllers/juryDuty.js'
import { validateJWT } from '../utils/jwt.js'

const router = express.Router()

router.post('/serve', validateJWT, controller.assignCase) // assigns user to a random eligible case. case should have >2hrs remaining in jury phase
router.get('/:assignment_id', validateJWT, controller.getAssignment) // RESTRICTED; get assignment details
router.put('/:assignment_id/vote', validateJWT, controller.castBallot) // body: { verdict, bestArgumentIds }
// users cannot change vote once jury phase has passed
// make sure to delete previously voted best arguments from jury_arg_refs

export default router