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
  openTime: '07:00',
  checkInNormalUntilTime: '08:00',
  lateToleranceMinutes: 15,
  checkOutTime: '16:00',
  closeTime: '22:00',
}

function getTimeMinutes(time) {
  const [hour, minute] = time.split(':').map((value) => Number(value))

  return (hour * 60) + minute
}

function formatTimeMinutes(minutes) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
  const minute = String(minutes % 60).padStart(2, '0')

  return `${hour}:${minute}`
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

function normalizeIntegerEnv(key, fallback, { max, min }) {
  const value = readEnv(key)

  if (!value) {
    return fallback
  }

  const parsedValue = Number(value)

  if (
    !Number.isInteger(parsedValue)
    || parsedValue < min
    || parsedValue > max
  ) {
    console.warn(`[WARN] ${key} tidak valid, memakai default ${fallback}`)

    return fallback
  }

  return parsedValue
}

function deriveLateAfterTime(checkInNormalUntilTime, lateToleranceMinutes) {
  const lateAfterMinutes = getTimeMinutes(checkInNormalUntilTime) + lateToleranceMinutes

  if (lateAfterMinutes >= 24 * 60) {
    return ''
  }

  return formatTimeMinutes(lateAfterMinutes)
}

function buildAttendanceConfig(config) {
  return {
    ...config,
    lateAfterTime: deriveLateAfterTime(
      config.checkInNormalUntilTime,
      config.lateToleranceMinutes,
    ),
  }
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
const configuredAttendance = buildAttendanceConfig({
  openTime: normalizeTimeEnv('ATTENDANCE_OPEN_TIME', defaultAttendance.openTime),
  checkInNormalUntilTime: normalizeTimeEnv(
    'ATTENDANCE_CHECK_IN_NORMAL_UNTIL',
    defaultAttendance.checkInNormalUntilTime,
  ),
  lateToleranceMinutes: normalizeIntegerEnv(
    'ATTENDANCE_LATE_TOLERANCE_MINUTES',
    defaultAttendance.lateToleranceMinutes,
    { min: 0, max: 240 },
  ),
  checkOutTime: normalizeTimeEnv('ATTENDANCE_CHECK_OUT_TIME', defaultAttendance.checkOutTime),
  closeTime: normalizeTimeEnv('ATTENDANCE_CLOSE_TIME', defaultAttendance.closeTime),
})
const defaultAttendanceConfig = buildAttendanceConfig(defaultAttendance)
const attendanceOrderIsValid = getTimeMinutes(configuredAttendance.openTime)
  <= getTimeMinutes(configuredAttendance.checkInNormalUntilTime)
  && Boolean(configuredAttendance.lateAfterTime)
  && getTimeMinutes(configuredAttendance.checkInNormalUntilTime)
  <= getTimeMinutes(configuredAttendance.lateAfterTime)
  && getTimeMinutes(configuredAttendance.lateAfterTime)
  <= getTimeMinutes(configuredAttendance.checkOutTime)
  && getTimeMinutes(configuredAttendance.checkOutTime)
  <= getTimeMinutes(configuredAttendance.closeTime)
const attendance = attendanceOrderIsValid
  ? configuredAttendance
  : defaultAttendanceConfig

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

const env = {
  port: parseInt(readEnv('PORT'), 10) || 5050,
  nodeEnv,
  clientUrl: clientUrls[0],
  clientUrls,
  attendance,
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
