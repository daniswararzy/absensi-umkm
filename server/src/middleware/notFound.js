/**
 * notFound — 404 catch-all middleware.
 *
 * Must be registered after all valid routes.
 * Forwards a 404 error to the error handler.
 */
function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}`,
  })
}

module.exports = notFound
