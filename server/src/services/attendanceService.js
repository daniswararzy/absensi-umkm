const { supabase } = require('../config')
const faceService = require('./faceService')

const FACE_RECOGNITION_METHOD = 'Face Recognition'

function createHttpError(message, statusCode) {
  const err = new Error(message)
  err.statusCode = statusCode

  return err
}

function requireSupabase() {
  if (!supabase) {
    throw createHttpError('Database belum dikonfigurasi', 503)
  }
}

function normalizeMethod(method) {
  const value = typeof method === 'string' ? method.trim() : ''

  if (!value) {
    return FACE_RECOGNITION_METHOD
  }

  if (value.toLowerCase() !== FACE_RECOGNITION_METHOD.toLowerCase()) {
    throw createHttpError('Absensi wajah hanya menerima metode Face Recognition', 400)
  }

  return FACE_RECOGNITION_METHOD
}

function getJakartaParts() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  )

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  }
}

function getAttendanceStatus(time) {
  const [hour, minute] = time.split(':').map((value) => Number(value))

  return hour > 8 || (hour === 8 && minute > 0) ? 'Terlambat' : 'Hadir'
}

function toAttendanceRecord(row) {
  return {
    id: row.id,
    employeeId: row.pegawai_id,
    date: row.tanggal,
    checkIn: row.jam_masuk,
    checkOut: row.jam_keluar,
    status: row.status,
    method: row.metode,
  }
}

async function ensureEmployeeExists(employeeId) {
  const { data, error } = await supabase
    .from('pegawai')
    .select('id')
    .eq('id', employeeId)
    .single()

  if (error || !data) {
    throw createHttpError('Pegawai tidak ditemukan', 404)
  }
}

async function resolveEmployeeForAttendance(payload = {}) {
  if (!Array.isArray(payload.descriptor)) {
    throw createHttpError('Descriptor wajah wajib dikirim untuk absensi wajah', 400)
  }

  const requestedEmployeeId = typeof payload.employeeId === 'string'
    ? payload.employeeId.trim()
    : ''
  const match = await faceService.verifyFace({
    descriptor: payload.descriptor,
    employeeId: requestedEmployeeId || undefined,
  })

  if (!match.matched) {
    const statusCode = match.reason === 'not_registered' ? 404 : 401

    throw createHttpError(match.message || 'Wajah tidak cocok dengan data pegawai', statusCode)
  }

  return match.employeeId
}

async function getTodayRecord(employeeId, date) {
  const { data, error } = await supabase
    .from('absensi')
    .select('id, pegawai_id, tanggal, jam_masuk, jam_keluar, status, metode')
    .eq('pegawai_id', employeeId)
    .eq('tanggal', date)
    .maybeSingle()

  if (error) {
    throw createHttpError('Gagal mengambil data absensi hari ini', 500)
  }

  return data
}

async function checkIn(payload = {}) {
  requireSupabase()

  const method = normalizeMethod(payload.method)
  const employeeId = await resolveEmployeeForAttendance(payload)
  const { date, time } = getJakartaParts()

  await ensureEmployeeExists(employeeId)

  const existing = await getTodayRecord(employeeId, date)

  if (existing?.jam_masuk) {
    throw createHttpError('Pegawai sudah melakukan absensi masuk hari ini', 409)
  }

  if (existing) {
    const { data, error } = await supabase
      .from('absensi')
      .update({
        jam_masuk: time,
        metode: method,
        status: getAttendanceStatus(time),
      })
      .eq('id', existing.id)
      .select('id, pegawai_id, tanggal, jam_masuk, jam_keluar, status, metode')
      .single()

    if (error) {
      throw createHttpError('Gagal menyimpan absensi masuk', 500)
    }

    return toAttendanceRecord(data)
  }

  const { data, error } = await supabase
    .from('absensi')
    .insert({
      jam_masuk: time,
      metode: method,
      pegawai_id: employeeId,
      status: getAttendanceStatus(time),
      tanggal: date,
    })
    .select('id, pegawai_id, tanggal, jam_masuk, jam_keluar, status, metode')
    .single()

  if (error) {
    throw createHttpError('Gagal menyimpan absensi masuk', 500)
  }

  return toAttendanceRecord(data)
}

async function checkOut(payload = {}) {
  requireSupabase()

  const method = normalizeMethod(payload.method)
  const employeeId = await resolveEmployeeForAttendance(payload)
  const { date, time } = getJakartaParts()

  await ensureEmployeeExists(employeeId)

  const existing = await getTodayRecord(employeeId, date)

  if (!existing?.jam_masuk) {
    throw createHttpError('Tidak boleh absensi pulang sebelum absensi masuk', 400)
  }

  if (existing.jam_keluar) {
    throw createHttpError('Pegawai sudah melakukan absensi pulang hari ini', 409)
  }

  const { data, error } = await supabase
    .from('absensi')
    .update({
      jam_keluar: time,
      metode: method,
    })
    .eq('id', existing.id)
    .select('id, pegawai_id, tanggal, jam_masuk, jam_keluar, status, metode')
    .single()

  if (error) {
    throw createHttpError('Gagal menyimpan absensi pulang', 500)
  }

  return toAttendanceRecord(data)
}

module.exports = {
  checkIn,
  checkOut,
}
