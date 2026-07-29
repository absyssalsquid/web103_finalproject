import express from 'express'
import controller from '../controllers/cases.js'
import multer from "multer";

import { validateJWT } from '../utils/jwt.js'
import { validateCaseSubmission } from '../utils/validation.js'

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router()
router.get('/', controller.getCases) // with query phase filters and sort
// ?phase=provisional|evidence|arguments|verdict|ruling
// ?sort=newest|oldest|popular|prosecute|defend|countdown
// ?search=...
// ?limit=20&offset=0

// NOTE: due to case fact dependencies, users CANNOT edit case details, evidence, or arguments

router.post('/', validateJWT, upload.single('image'), validateCaseSubmission, controller.createCase)
router.patch('/:id/withdraw', validateJWT, controller.withdrawCase) // users CANNOT delete, only withdraw
router.get('/:id', controller.getCase) // get basic data for card
router.get('/:id/complete', controller.getCompleteCase) // get full data for case detail page: 
// general details
// evidence
// args
// jury summary
// judge ruling

router.put('/:id/vote', validateJWT, controller.voteCase)
router.get('/:id/votes', controller.voteCountCase)

router.get('/:id/evidence', controller.getCaseEvidence) // query params ?limit=20&offset=0&sort=oldest|newest|most-voted
router.get('/:id/arguments', controller.getCaseArguments) // query params ?limit=20&offset=0&sort=oldest|newest|most-voted

// if jury phase has not ended, only return jury count
// if jury phase has ended, also return vote breakdown
router.get('/:id/jury-summary', controller.getJurySummary)

router.put('/:id/ruling', validateJWT, controller.submitRuling)

router.put('/:id/change-phase', validateJWT, controller.changePhase)  // for rollback or manual advance, only presiding judge can trigger

export default router