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
const healthRoutes = require('./healthRoutes')

const router = Router()

router.use('/api/health', healthRoutes)

// ─── Future routes ──────────────────────────
// router.use('/api/auth',       authRoutes)
// router.use('/api/employees',  employeeRoutes)
// router.use('/api/attendance', attendanceRoutes)

module.exports = router
