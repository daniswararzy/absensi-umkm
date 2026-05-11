/**
 * authRoutes.js — /api/auth
 *
 * POST /api/auth/login  — public, authenticate user
 * GET  /api/auth/me     — protected, return current user
 */

const { Router } = require('express')
const { login, me } = require('../controllers/authController')
const verifyToken = require('../middleware/verifyToken')

const router = Router()

router.post('/login', login)
router.get('/me', verifyToken, me)

module.exports = router
