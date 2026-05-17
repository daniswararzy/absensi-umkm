const { Router } = require('express')
const {
  checkIn,
  checkOut,
} = require('../controllers/attendanceController')

const router = Router()

router.post('/check-in', checkIn)
router.post('/check-out', checkOut)

module.exports = router
