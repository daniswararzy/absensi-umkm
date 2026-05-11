const { Router } = require('express')
const {
  checkIn,
  checkOut,
} = require('../controllers/attendanceController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

router.use(verifyToken)
router.use(requireRole('admin', 'pegawai'))

router.post('/check-in', checkIn)
router.post('/check-out', checkOut)

module.exports = router
