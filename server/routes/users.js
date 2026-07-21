import express from 'express'
import controller from '../controllers/users.js'

const router = express.Router()

router.get('/:id', controller.getUser) // basic public card data

router.get('/:id/stats', controller.getUserStats)
router.get('/:id/achievements', controller.getUserAchievements)
router.get('/:id/submissions', controller.getUserSubmissions) // ?limit=20&offset=0&type=cases|evidence|arguments|all

// disabled for now, stretch features
// router.get('/leaderboard', controller.getLeaderboard) // ?sort=xp|cases|votes&limit=100
// router.get('/', controller.searchUsers) // ?search=username&limit=20&offset=0

export default router