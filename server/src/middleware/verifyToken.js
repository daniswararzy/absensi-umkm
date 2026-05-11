/**
 * verifyToken.js — JWT authentication middleware.
 *
 * Extracts and verifies the Bearer token from the Authorization header.
 * On success, attaches decoded payload to req.user:
 *   req.user = { userId: string, role: string, iat, exp }
 *
 * Usage:
 *   router.get('/protected', verifyToken, handler)
 */

const jwt = require('jsonwebtoken')
const { env } = require('../config')

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.jwt.secret)

    req.user = decoded

    next()
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token sudah kadaluarsa. Silakan login ulang.'
      : 'Token tidak valid.'

    return res.status(401).json({
      success: false,
      message,
    })
  }
}

module.exports = verifyToken
