/**
 * laporanRoutes.js — Routes for laporan.
 */

const { Router } = require('express')
const { getLaporan } = require('../controllers/laporanController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

router.use(verifyToken)

// GET /api/laporan
router.get('/', requireRole('admin'), getLaporan)

module.exports = router
