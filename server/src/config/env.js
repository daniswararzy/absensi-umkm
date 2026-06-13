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

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const defaultAttendance = {
  openTime: '09:00',
  closeTime: '22:00',
}

const LAT_LON_PATTERN = /^-?\d{1,3}(\.\d+)?$/
const defaultOffice = {
  latitude: null,
  longitude: null,
  radiusMeters: 200,
}

function parseCoordinate(key, fallback) {
  const value = readEnv(key)

  if (!value) {
    return fallback
  }

  const num = parseFloat(value)

  if (!LAT_LON_PATTERN.test(value) || !Number.isFinite(num)) {
    console.warn(`[WARN] ${key} tidak valid, geolocation dinonaktifkan`)
    return fallback
  }

  return num
}

function getTimeMinutes(time) {
  const [hour, minute] = time.split(':').map((value) => Number(value))

  return (hour * 60) + minute
}

function normalizeTimeEnv(key, fallback) {
  const value = readEnv(key)

  if (!value) {
    return fallback
  }

  if (!TIME_PATTERN.test(value)) {
    console.warn(`[WARN] ${key} tidak valid, memakai default ${fallback}`)

    return fallback
  }

  return value
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
const configuredAttendance = {
  openTime: normalizeTimeEnv('ATTENDANCE_OPEN_TIME', defaultAttendance.openTime),
  closeTime: normalizeTimeEnv('ATTENDANCE_CLOSE_TIME', defaultAttendance.closeTime),
}
const attendanceOrderIsValid = getTimeMinutes(configuredAttendance.openTime)
  < getTimeMinutes(configuredAttendance.closeTime)
const attendance = attendanceOrderIsValid
  ? configuredAttendance
  : defaultAttendance

if (!attendanceOrderIsValid) {
  console.warn('[WARN] Konfigurasi jam absensi tidak berurutan, memakai default.')
}

const configuredJwtSecret = readEnv('JWT_SECRET')
const unsafeJwtSecrets = new Set([
  'your_secret_key_here',
  'replace_with_a_long_random_secret',
  'absensi_umkm_dev_secret',
])

if (nodeEnv === 'production' && (!configuredJwtSecret || unsafeJwtSecrets.has(configuredJwtSecret))) {
  throw new Error('JWT_SECRET wajib diisi dengan nilai aman untuk production.')
}

const officeLatitude = parseCoordinate('OFFICE_LATITUDE', defaultOffice.latitude)
const officeLongitude = parseCoordinate('OFFICE_LONGITUDE', defaultOffice.longitude)
const officeRadiusRaw = parseInt(readEnv('OFFICE_RADIUS_METERS'), 10)
const officeRadius = Number.isFinite(officeRadiusRaw) && officeRadiusRaw > 0
  ? officeRadiusRaw
  : defaultOffice.radiusMeters
const officeConfigured = officeLatitude !== null && officeLongitude !== null

if (!officeConfigured) {
  console.warn('[WARN] OFFICE_LATITUDE / OFFICE_LONGITUDE belum diisi. Validasi geolocation dinonaktifkan.')
}

const env = {
  port: parseInt(readEnv('PORT'), 10) || 5050,
  nodeEnv,
  clientUrl: clientUrls[0],
  clientUrls,
  attendance,
  office: {
    latitude: officeLatitude,
    longitude: officeLongitude,
    radiusMeters: officeRadius,
    configured: officeConfigured,
  },
  jwt: {
    secret: configuredJwtSecret || 'absensi_umkm_dev_secret',
    expiresIn: readEnv('JWT_EXPIRES_IN') || '7d',
  },
  supabase: {
    url: readEnv('SUPABASE_URL'),
    serviceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
}

module.exports = env
