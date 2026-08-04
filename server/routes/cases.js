import express from 'express'
import controller from '../controllers/cases.js'
import argumentsController from '../controllers/arguments.js'
import multer from "multer";

import { requireJWT, checkJWT } from '../middleware/jwt.js'
import { validateCaseSubmission, validateArgumentSubmission, normalizeArgumentSubmission, validateJudgeVerdict } from '../middleware/submissionValidation.js'
import { validateQueryPageLimit, validateCaseQuery, validateEvidenceQuery, validateArgumentQuery } from '../middleware/queryValidation.js'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error('UNSUPPORTED_IMAGE_TYPE'))
    }
    cb(null, true)
  },
});

// Wraps upload.single('image') so Multer errors (bad type, too large, extra
// files, malformed multipart) get a controlled JSON response instead of
// falling through to Express's default error handling.
function uploadCaseImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next()

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image must be 5MB or smaller.' })
    }
    if (err.message === 'UNSUPPORTED_IMAGE_TYPE') {
      return res.status(400).json({ error: 'Only JPEG, PNG, or WebP images are allowed.' })
    }
    // any other Multer/Busboy error: unexpected extra file, malformed
    // multipart body, etc.
    return res.status(400).json({ error: 'Invalid image upload.' })
  })
}

const router = express.Router()
router.get('/', checkJWT, validateQueryPageLimit, validateCaseQuery, controller.getCases) // with query phase filters and sort

// NOTE: due to case fact dependencies, users CANNOT edit case details, evidence, or arguments

router.post('/', requireJWT, uploadCaseImage, validateCaseSubmission, controller.createCase)
router.patch('/:id/withdraw', requireJWT, controller.withdrawCase) // users CANNOT delete, only withdraw
router.get('/:id', controller.getCase) // get basic data for card

router.put('/:id/vote', requireJWT, controller.voteCase)
router.get('/:id/votes', controller.voteCountCase)

router.get('/:id/evidence', checkJWT, validateQueryPageLimit, validateEvidenceQuery, controller.getCaseEvidence) // query params ?limit=20&page=1&sort=oldest|newest|most-voted
router.get('/:id/arguments', checkJWT, validateQueryPageLimit, validateArgumentQuery, controller.getCaseArguments) // query params ?limit=20&page=1&sort=oldest|newest|most-voted
router.post('/:id/arguments', requireJWT, normalizeArgumentSubmission, validateArgumentSubmission, argumentsController.createArgument) // canonical endpoint (#78); body: { text, argument_tag, case_citations, evidence_citations }

router.get('/:id/jury-summary', controller.getJurySummary)

router.put('/:id/ruling', requireJWT, controller.submitRuling)

router.post('/:id/judge-verdict', requireJWT, validateJudgeVerdict, controller.submitJudgeVerdict) // #98: judge submits final verdict, transitions RULING -> CLOSED

router.put('/:id/change-phase', requireJWT, controller.changePhase)  // for rollback or manual advance, only presiding judge can trigger

export default router