/**
 * app.js — Express application factory.
 *
 * Creates and configures the Express app without starting
 * the server. This separation allows the app to be used
 * in tests without binding a port.
 *
 * Stack order:
 *   1. requestLogger  (dev only)
 *   2. cors
 *   3. JSON body parser
 *   4. API routes
 *   5. 404 handler
 *   6. Error handler
 */

const express = require('express')
const cors = require('cors')

const { env } = require('./config')
const routes = require('./routes')
const { errorHandler, notFound, requestLogger } = require('./middleware')

const app = express()

// ─── Global Middleware ───────────────────────

app.use(requestLogger)

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Root endpoint ──────────────────────────

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Absensi UMKM berjalan',
    version: '1.0.0',
    docs: {
      health: 'GET /api/health',
    },
  })
})

// ─── API Routes ─────────────────────────────

app.use(routes)

// ─── Error Handling ─────────────────────────

app.use(notFound)
app.use(errorHandler)

module.exports = app
