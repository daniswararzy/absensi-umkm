/**
 * env.js — centralized environment config.
 *
 * Loads server/.env from this config layer so every backend entrypoint
 * reads the same environment values.
 */

const path = require('path')
const dotenv = require('dotenv')

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
})

function readEnv(key) {
  return (process.env[key] || '').trim()
}

const nodeEnv = readEnv('NODE_ENV') || 'development'
const defaultClientUrls = ['http://localhost:5173', 'http://127.0.0.1:5173']
const configuredClientUrls = readEnv('CLIENT_URL')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)
const clientUrls = configuredClientUrls.length > 0
  ? [
      ...new Set(
        nodeEnv === 'production'
          ? configuredClientUrls
          : [...configuredClientUrls, ...defaultClientUrls],
      ),
    ]
  : defaultClientUrls

const env = {
  port: parseInt(readEnv('PORT'), 10) || 5050,
  nodeEnv,
  clientUrl: clientUrls[0],
  clientUrls,
  jwt: {
    secret: readEnv('JWT_SECRET') || 'absensi_umkm_dev_secret',
    expiresIn: readEnv('JWT_EXPIRES_IN') || '7d',
  },
  supabase: {
    url: readEnv('SUPABASE_URL'),
    serviceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
}

module.exports = env
