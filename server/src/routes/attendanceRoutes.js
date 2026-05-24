const { Router } = require('express')
const {
  checkIn,
  checkOut,
} = require('../controllers/attendanceController')
const rateLimit = require('../middleware/rateLimit')

const router = Router()
const attendanceWriteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Terlalu banyak request absensi. Silakan coba lagi nanti.',
})

router.post('/check-in', attendanceWriteRateLimit, checkIn)
router.post('/check-out', attendanceWriteRateLimit, checkOut)

module.exports = router
