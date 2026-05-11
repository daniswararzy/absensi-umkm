/**
 * authController.js — auth endpoint handlers.
 *
 * POST /api/auth/login  — authenticate and return JWT
 * GET  /api/auth/me     — return current user from token
 */

const jwt = require('jsonwebtoken')
const { env } = require('../config')
const authService = require('../services/authService')

/**
 * POST /api/auth/login
 *
 * Body: { username: string, password: string }
 * Response: { success, data: { user, token } }
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body

    // Verify credentials via service
    const user = await authService.verifyCredentials(username, password)

    // Generate JWT
    const payload = { userId: user.id, role: user.role }
    const token = jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    })

    // Determine redirect based on role
    const redirectTo = user.role === 'admin' ? '/dashboard' : '/dashboard-pegawai'

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          label: user.label,
        },
        token,
        redirectTo,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 *
 * Requires auth middleware. Returns current user data.
 * Response: { success, data: { user } }
 */
async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.userId)

    if (!user) {
      const err = new Error('User tidak ditemukan')
      err.statusCode = 404
      throw err
    }

    res.json({
      success: true,
      data: { user },
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { login, me }
