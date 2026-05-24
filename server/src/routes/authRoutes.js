/**
 * authRoutes.js — /api/auth
 *
 * POST /api/auth/login  — public, authenticate user
 * GET  /api/auth/me     — protected, return current user
 */

const { Router } = require('express')
const { login, me } = require('../controllers/authController')
const rateLimit = require('../middleware/rateLimit')
const verifyToken = require('../middleware/verifyToken')

const router = Router()
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
})

router.post('/login', loginRateLimit, login)
router.get('/me', verifyToken, me)

module.exports = router
