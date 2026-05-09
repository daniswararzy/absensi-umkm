/**
 * healthController — health check endpoint handlers.
 */

function getHealth(req, res) {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'absensi-umkm-api',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
    },
  })
}

module.exports = { getHealth }
