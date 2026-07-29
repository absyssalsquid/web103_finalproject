import express from 'express'
import controller from '../controllers/arguments.js'
import { validateJWT } from '../utils/jwt.js'

const router = express.Router()

router.post('/', validateJWT, controller.createArgument)  // body: { caseId, content, ... }
router.get('/:id', controller.getArgument)
router.delete('/:id', validateJWT, controller.deleteArgument) // Users CANNOT delete once argument phase has passed

router.put('/:id/vote', validateJWT, controller.voteArgument) // Users CANNOT vote/or change once argument phase has passed
router.get('/:id/votes', controller.voteCountArgument)

export default router
