/**
 * requestLogger — simple request logging middleware.
 *
 * Logs method, URL, status code, and response time.
 * Disabled in production (use a proper logger instead).
 */
function requestLogger(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return next()
  }

  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode

    console.log(
      `[${new Date().toLocaleTimeString('id-ID')}] ${req.method} ${req.originalUrl} → ${status} (${duration}ms)`,
    )
  })

  next()
}

module.exports = requestLogger
