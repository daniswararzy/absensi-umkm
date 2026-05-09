/**
 * errorHandler — global Express error middleware.
 *
 * Catches all errors thrown in routes/controllers and
 * returns a consistent JSON error response.
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Terjadi kesalahan internal'

  // Log the error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

module.exports = errorHandler
