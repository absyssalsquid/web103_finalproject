import express from 'express'
import controller from '../controllers/config.js'

const router = express.Router()

router.get('/limits', controller.getLimits) // global limits for all users

export default router
