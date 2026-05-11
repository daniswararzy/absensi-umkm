/**
 * pegawaiRoutes.js — /api/pegawai
 *
 * All routes require authentication (verifyToken).
 * Only admin can create, update, and delete.
 */

const { Router } = require('express')
const { create, getAll, getById, remove, update } = require('../controllers/pegawaiController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const router = Router()

// All pegawai routes require auth
router.use(verifyToken)

router.get('/', getAll)
router.get('/:id', getById)
router.post('/', requireRole('admin'), create)
router.put('/:id', requireRole('admin'), update)
router.delete('/:id', requireRole('admin'), remove)

module.exports = router
