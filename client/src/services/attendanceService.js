/**
 * attendanceService.js — attendance data service layer.
 *
 * Encapsulates ALL attendance-related data operations:
 *   - fetch today's records / filtered records
 *   - check-in / check-out
 *   - report data with filters
 */

import { apiFetch } from './apiClient'

// ─── Helpers ─────────────────────────────────

function createServiceError(error, message) {
  const nextError = new Error(message)

  nextError.status = error?.status
  nextError.data = error?.data

  return nextError
}

function buildLaporanPath(filters = {}) {
  const query = new URLSearchParams()

  if (filters.tanggal) {
    query.set('tanggal', filters.tanggal)
  }

  if (filters.pegawai_id) {
    query.set('pegawai_id', filters.pegawai_id)
  }

  if (filters.tanggal_mulai) {
    query.set('tanggal_mulai', filters.tanggal_mulai)
  }

  if (filters.tanggal_selesai) {
    query.set('tanggal_selesai', filters.tanggal_selesai)
  }

  const queryString = query.toString()

  return queryString ? `/api/laporan?${queryString}` : '/api/laporan'
}

function getJakartaDateKey() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

function getAttendanceErrorMessage(error) {
  if (error?.status === 0) {
    return 'Koneksi bermasalah atau server tidak merespons. Silakan coba lagi.'
  }

  const message = error?.message || ''
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('sudah melakukan absensi masuk')) {
    return 'Anda sudah melakukan absensi masuk hari ini.'
  }

  if (normalizedMessage.includes('absensi belum dibuka')) {
    return message
  }

  if (normalizedMessage.includes('absensi sudah ditutup')) {
    return message
  }

  if (
    normalizedMessage.includes('sebelum absensi masuk')
    || normalizedMessage.includes('belum absensi masuk')
  ) {
    return 'Absensi pulang belum dapat dilakukan karena absensi masuk belum tercatat.'
  }

  if (normalizedMessage.includes('sudah melakukan absensi pulang')) {
    return 'Anda sudah melakukan absensi pulang hari ini.'
  }

  if (normalizedMessage.includes('pegawai tidak ditemukan')) {
    return 'Pegawai tidak ditemukan.'
  }

  if (normalizedMessage.includes('wajah tidak cocok')) {
    return 'Wajah tidak cocok dengan data pegawai yang terdaftar.'
  }

  if (error?.status >= 500) {
    return 'Server sedang bermasalah. Silakan coba lagi.'
  }

  return message || 'Gagal menyimpan absensi. Silakan coba lagi.'
}

function normalizeAttendanceRecord(record = {}) {
  return {
    ...record,
    employeeId: record.employeeId || record.pegawai_id || '',
    checkIn: record.checkIn || record.jam_masuk || '',
    checkOut: record.checkOut || record.jam_keluar || '',
  }
}

function normalizeReportRecord(report = {}) {
  return normalizeAttendanceRecord({
    id: report.id,
    employeeId: report.pegawaiId || report.employeeId || '',
    employeeName: report.nama || report.employeeName || 'Unknown',
    date: report.tanggal || report.date || '',
    checkIn: report.jamMasuk || report.checkIn || '',
    checkOut: report.jamKeluar || report.checkOut || '',
    status: report.status || 'Belum Absen',
    method: report.metode || report.method || '-',
  })
}

function getReportData(response) {
  if (!response?.success || !response.data || !Array.isArray(response.data.reports)) {
    throw new Error('Format response laporan tidak valid')
  }

  return response.data.reports
}

async function fetchReports(filters = {}) {
  const response = await apiFetch(buildLaporanPath(filters))

  return getReportData(response)
}

function getAttendanceScore(summary) {
  const total = summary.hadir
    + summary.terlambat
    + summary.izin
    + summary.alfa
    + summary.belumAbsen

  if (total === 0) {
    return '0%'
  }

  return `${Math.round(((summary.hadir + summary.terlambat) / total) * 100)}%`
}

function summarizeAttendance(records) {
  const summaries = new Map()

  records.forEach((record) => {
    const key = record.employeeId || record.employeeName
    const current = summaries.get(key) || {
      employeeId: record.employeeId,
      employeeName: record.employeeName || 'Unknown',
      hadir: 0,
      terlambat: 0,
      izin: 0,
      alfa: 0,
      belumAbsen: 0,
      score: '0%',
    }

    if (record.status === 'Hadir') current.hadir += 1
    else if (record.status === 'Terlambat') current.terlambat += 1
    else if (record.status === 'Izin') current.izin += 1
    else if (record.status === 'Alfa') current.alfa += 1
    else if (record.status === 'Belum Absen') current.belumAbsen += 1

    current.score = getAttendanceScore(current)
    summaries.set(key, current)
  })

  return [...summaries.values()]
}

async function submitAttendance(path, payload) {
  try {
    const response = await apiFetch(path, {
      method: 'POST',
      auth: false,
      body: payload,
    })

    if (!response?.success || !response.data?.record) {
      throw new Error('Format response absensi tidak valid')
    }

    return normalizeAttendanceRecord(response.data.record)
  } catch (error) {
    throw createServiceError(error, getAttendanceErrorMessage(error))
  }
}

// ─── Read ────────────────────────────────────

/**
 * Fetch today's attendance records.
 *
 * @returns {Promise<object[]>}
 */
async function getTodayAttendance() {
  const reports = await fetchReports({ tanggal: getJakartaDateKey() })

  return reports.map(normalizeReportRecord)
}

/**
 * Fetch attendance records with filters.
 *
 * @param {{ date?: string, employeeId?: string, status?: string }} [filters]
 * @returns {Promise<object[]>}
 */
async function getAttendanceRecords(filters = {}) {
  const reports = await fetchReports({
    tanggal: filters.date,
    tanggal_mulai: filters.startDate,
    tanggal_selesai: filters.endDate,
    pegawai_id: filters.employeeId,
  })
  let result = reports.map(normalizeReportRecord)

  if (filters.status) {
    result = result.filter((record) => record.status === filters.status)
  }

  return result
}

/**
 * Fetch a single employee's attendance for today.
 *
 * @param {string} employeeId
 * @returns {Promise<object|null>}
 */
async function getEmployeeAttendanceToday(employeeId) {
  const records = await getAttendanceRecords({
    date: getJakartaDateKey(),
    employeeId,
  })

  return records.find((record) => record.employeeId === employeeId) || null
}

// ─── Actions ─────────────────────────────────

/**
 * Record check-in for an employee.
 *
 * @param {{ employeeId: string, method?: string }} payload
 * @returns {Promise<object>} — the created attendance record
 */
async function checkIn(payload) {
  return submitAttendance('/api/attendance/check-in', payload)
}

/**
 * Record check-out for an employee.
 *
 * @param {{ employeeId: string, attendanceId?: string }} payload
 * @returns {Promise<object>} — the updated attendance record
 */
async function checkOut(payload) {
  return submitAttendance('/api/attendance/check-out', payload)
}

// ─── Reports ─────────────────────────────────

/**
 * Fetch attendance report data (aggregated per employee).
 *
 * @param {{ startDate?: string, endDate?: string }} [filters]
 * @returns {Promise<object[]>}
 */
async function getAttendanceReport(filters = {}) {
  const date = filters.date || filters.tanggal || (
    filters.startDate === filters.endDate ? filters.startDate : undefined
  )
  const records = await getAttendanceRecords({
    date,
    endDate: date ? undefined : filters.endDate,
    startDate: date ? undefined : filters.startDate,
  })

  return summarizeAttendance(records)
}

// ─── Public API ──────────────────────────────

export {
  checkIn,
  checkOut,
  getAttendanceRecords,
  getAttendanceReport,
  getEmployeeAttendanceToday,
  getTodayAttendance,
}
