import express from 'express'
import controller from '../controllers/cases.js'
import multer from "multer";

import { validateJWT } from '../middleware/jwt.js'
import { validateCaseSubmission} from '../middleware/submissionValidation.js'
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
router.get('/', validateQueryPageLimit, validateCaseQuery, controller.getCases) // with query phase filters and sort
// ?phase=provisional|evidence|arguments|verdict|ruling
// ?sort=newest|oldest|popular|prosecute|defend|countdown
// ?search=...
// ?limit=20&offset=0

// NOTE: due to case fact dependencies, users CANNOT edit case details, evidence, or arguments

router.post('/', validateJWT, uploadCaseImage, validateCaseSubmission, controller.createCase)
router.patch('/:id/withdraw', validateJWT, controller.withdrawCase) // users CANNOT delete, only withdraw
router.get('/:id', controller.getCase) // get basic data for card

router.put('/:id/vote', validateJWT, controller.voteCase)
router.get('/:id/votes', controller.voteCountCase)

router.get('/:id/evidence', validateQueryPageLimit, validateEvidenceQuery, controller.getCaseEvidence) // query params ?limit=20&offset=0&sort=oldest|newest|most-voted
router.get('/:id/arguments', validateQueryPageLimit, controller.getCaseArguments) // query params ?limit=20&offset=0&sort=oldest|newest|most-voted

// if jury phase has not ended, only return jury count
// if jury phase has ended, also return vote breakdown
router.get('/:id/jury-summary', controller.getJurySummary)

router.put('/:id/ruling', validateJWT, controller.submitRuling)

router.put('/:id/change-phase', validateJWT, controller.changePhase)  // for rollback or manual advance, only presiding judge can trigger

export default router