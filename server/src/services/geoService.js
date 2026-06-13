/**
 * geoService.js — Layanan validasi geolocation kantor.
 *
 * Menggunakan formula Haversine untuk menghitung jarak antara dua titik
 * koordinat di permukaan bumi, kemudian membandingkan dengan radius kantor
 * yang dikonfigurasi di environment variable.
 */

const { env } = require('../config')

const EARTH_RADIUS_METERS = 6_371_000

/**
 * Mengubah derajat ke radian.
 * @param {number} degrees
 * @returns {number}
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

/**
 * Menghitung jarak antara dua titik koordinat (Haversine formula).
 * @param {number} lat1 - Latitude titik pertama (derajat)
 * @param {number} lon1 - Longitude titik pertama (derajat)
 * @param {number} lat2 - Latitude titik kedua (derajat)
 * @param {number} lon2 - Longitude titik kedua (derajat)
 * @returns {number} Jarak dalam meter
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/**
 * Membuat HTTP error.
 * @param {string} message
 * @param {number} statusCode
 */
function createHttpError(message, statusCode) {
  const err = new Error(message)
  err.statusCode = statusCode

  return err
}

/**
 * Memvalidasi koordinat adalah angka yang valid.
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidCoordinate(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Memastikan pegawai berada dalam radius kantor.
 * Jika OFFICE_LATITUDE / OFFICE_LONGITUDE tidak dikonfigurasi, validasi dilewati
 * (agar backward-compatible saat env belum diisi).
 *
 * @param {{ latitude: number, longitude: number }} coords
 * @throws {Error} HTTP 400 jika koordinat tidak valid
 * @throws {Error} HTTP 403 jika di luar radius kantor
 */
function assertWithinOffice({ latitude, longitude }) {
  // Jika koordinat tidak dikirim dari client
  if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
    throw createHttpError(
      'Data lokasi (latitude/longitude) wajib dikirim untuk absensi.',
      400,
    )
  }

  // Jika server belum dikonfigurasi — skip validasi jarak, hanya wajibkan pengiriman koordinat
  if (!env.office.configured) {
    return
  }

  const distanceMeters = calculateDistance(
    latitude,
    longitude,
    env.office.latitude,
    env.office.longitude,
  )

  if (distanceMeters > env.office.radiusMeters) {
    const rounded = Math.round(distanceMeters)

    throw createHttpError(
      `Anda berada di luar area kantor (${rounded} m dari kantor). ` +
        `Absensi hanya bisa dilakukan dalam radius ${env.office.radiusMeters} m dari lokasi kantor.`,
      403,
    )
  }
}

module.exports = {
  calculateDistance,
  assertWithinOffice,
}
