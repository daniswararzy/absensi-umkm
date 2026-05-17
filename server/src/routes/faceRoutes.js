const { Router } = require('express')
const {
  getStatus,
  getStatusByEmployee,
  register,
  verify,
} = require('../controllers/faceController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

router.post('/verify', verify)

router.use(verifyToken)

router.get('/status', requireRole('admin'), getStatus)
router.get('/status/:employeeId', requireRole('admin'), getStatusByEmployee)
router.post('/register', requireRole('admin'), register)

module.exports = router
