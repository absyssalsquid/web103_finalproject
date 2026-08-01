import express from 'express'
import { USAGE_LIMITS, REFRESH_TIME, LENGTH_LIMITS } from '../config/userRules.js'
import {getRefreshTime} from '../utils/time.js'

const router = express.Router()

router.get('/user-limits', (req, res) => {
    res.json(USAGE_LIMITS);
})

router.get('/length-limits', (req, res) => {
    res.json(LENGTH_LIMITS);
})

router.get('/reset-time', (req, res) => {
    res.json(getRefreshTime());
})

export default router
