/**
 * routes/index.js — central route registry.
 *
 * All route modules are mounted here, then this single
 * router is mounted in app.js. To add a new domain:
 *
 *   1. Create routes/fooRoutes.js
 *   2. Mount here: router.use('/api/foo', fooRoutes)
 */

const { Router } = require('express')
const authRoutes = require('./authRoutes')
const attendanceRoutes = require('./attendanceRoutes')
const faceRoutes = require('./faceRoutes')
const healthRoutes = require('./healthRoutes')
const pegawaiRoutes = require('./pegawaiRoutes')
const laporanRoutes = require('./laporanRoutes')

const router = Router()

router.use('/api/auth', authRoutes)
router.use('/api/attendance', attendanceRoutes)
router.use('/api/face', faceRoutes)
router.use('/api/health', healthRoutes)
router.use('/api/pegawai', pegawaiRoutes)
router.use('/api/laporan', laporanRoutes)

module.exports = router
