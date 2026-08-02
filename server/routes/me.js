import express from 'express'
import multer from 'multer'
import controller from '../controllers/me.js'

import { requireJWT } from '../middleware/jwt.js'
import { validateQueryPageLimit } from '../middleware/queryValidation.js'
import { validateProfileUpdate } from '../middleware/submissionValidation.js'

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
})

// Wraps upload.single('image') so Multer errors (bad type, too large, extra
// files, malformed multipart) get a controlled JSON response instead of
// falling through to Express's default error handling.
function uploadProfileImage(req, res, next) {
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

router.get('/', requireJWT, (req, res) => {
    res.json(req.token_payload);
})
router.patch('/edit', requireJWT, uploadProfileImage, validateProfileUpdate, controller.updateUser)
router.get('/usage', requireJWT, controller.getUsage) // user participation for today

// disabled for now, stretch features
// router.delete('', controller.deleteAccount) 
// router.post('/verify-email/:token', controller.verifyEmail)

router.get('/activity/cases', requireJWT, validateQueryPageLimit, controller.getUserCases)
router.get('/activity/evidence', requireJWT, validateQueryPageLimit, controller.getUserEvidence)
router.get('/activity/arguments', requireJWT, validateQueryPageLimit, controller.getUserArguments)

router.get('/likes', requireJWT, controller.getUserLikes) // query params ?limit=20&page=1
router.get('/jury-assignments', requireJWT, controller.getUserJuryAssignments) // query params ?limit=20&page=1

export default router
