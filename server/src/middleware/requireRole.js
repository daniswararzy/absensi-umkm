/**
 * requireRole.js — role-based access control middleware.
 *
 * Must be used AFTER verifyToken (req.user must exist).
 *
 * Usage:
 *   router.get('/admin-only', verifyToken, requireRole('admin'), handler)
 *   router.get('/multi',      verifyToken, requireRole('admin', 'pegawai'), handler)
 */

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan.',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke resource ini.',
      })
    }

    next()
  }
}

module.exports = requireRole
