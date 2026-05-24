const { Router } = require('express')
const {
  getStatus,
  getStatusByEmployee,
  register,
  verify,
} = require('../controllers/faceController')
const rateLimit = require('../middleware/rateLimit')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()
const faceVerifyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Terlalu banyak percobaan verifikasi wajah. Silakan coba lagi nanti.',
})
const faceRegisterRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Terlalu banyak request registrasi wajah. Silakan coba lagi nanti.',
})

router.post('/verify', faceVerifyRateLimit, verify)

router.use(verifyToken)

router.get('/status', requireRole('admin'), getStatus)
router.get('/status/:employeeId', requireRole('admin'), getStatusByEmployee)
router.post('/register', requireRole('admin'), faceRegisterRateLimit, register)

module.exports = router
