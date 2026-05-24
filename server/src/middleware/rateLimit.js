function getClientKey(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  const forwardedIp = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : ''
  const ip = forwardedIp || req.ip || req.socket?.remoteAddress || 'unknown'
  const route = `${req.method}:${req.baseUrl}${req.path}`

  return `${ip}:${route}`
}

function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60 * 1000
  const max = options.max || 60
  const message = options.message || 'Terlalu banyak request. Silakan coba lagi nanti.'
  const buckets = new Map()

  return (req, res, next) => {
    const now = Date.now()

    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key)
      }
    }

    const key = getClientKey(req)
    const bucket = buckets.get(key)

    if (!bucket) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    bucket.count += 1

    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)))
      res.status(429).json({
        success: false,
        message,
      })
      return
    }

    next()
  }
}

module.exports = rateLimit
