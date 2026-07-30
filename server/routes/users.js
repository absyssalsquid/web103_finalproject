import express from 'express'
import controller from '../controllers/users.js'
import { validateJWT, requireOwnUser } from '../utils/jwt.js'
import { validateProfileUpdate } from '../utils/validation.js'

const router = express.Router()

router.get('/:user_id', controller.getUser) // basic public card data
router.get('/:user_id/stats', controller.getUserStats)
router.get('/:user_id/achievements', controller.getUserAchievements)
router.get('/:user_id/submissions', controller.getUserSubmissions) // ?limit=20&offset=0&type=cases|evidence|arguments|all

router.patch('/:id', validateJWT, requireOwnUser, validateProfileUpdate, controller.updateUser) // self-update bio/image_url only

// disabled for now, stretch features
// router.get('/leaderboard', controller.getLeaderboard) // ?sort=xp|cases|evidence|args|juryduty|citations&limit=100
// router.get('/', controller.searchUsers) // ?search=username&limit=20&offset=0

export default router