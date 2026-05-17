/**
 * attendanceService.js — attendance data service layer.
 *
 * Encapsulates ALL attendance-related data operations:
 *   - fetch today's records / filtered records
 *   - check-in / check-out
 *   - report data with filters
 *
 * ──────────────────────────────────────────────
 * MOCK vs REAL API
 *
 * Currently uses mock implementations backed by dummyData.
 * To switch to a real backend:
 *
 *   1. Uncomment the apiFetch import
 *   2. Replace each function body with the commented API call
 *   3. Remove the dummyData import
 *
 * The function signatures stay the same, so pages require
 * zero changes.
 * ──────────────────────────────────────────────
 */

import { attendanceRecords as dummyRecords, attendanceReport as dummyReport } from '../data/dummyData'
import { apiFetch } from './apiClient'

// ─── Helpers ─────────────────────────────────

function simulateDelay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200))
}

function createServiceError(error, message) {
  const nextError = new Error(message)

  nextError.status = error?.status
  nextError.data = error?.data

  return nextError
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
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch('/api/attendance/today')
 *   return data.records
 */
async function getTodayAttendance() {
  await simulateDelay()

  return [...dummyRecords]
}

/**
 * Fetch attendance records with filters.
 *
 * @param {{ date?: string, employeeId?: string, status?: string }} [filters]
 * @returns {Promise<object[]>}
 *
 * ⚠️ MOCK — replace with:
 *   const params = new URLSearchParams(filters).toString()
 *   const data = await apiFetch(`/api/attendance?${params}`)
 *   return data.records
 */
async function getAttendanceRecords(filters = {}) {
  await simulateDelay()

  let result = [...dummyRecords]

  if (filters.date) {
    result = result.filter((record) => record.date === filters.date)
  }

  if (filters.employeeId) {
    result = result.filter((record) => record.employeeId === filters.employeeId)
  }

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
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch(`/api/attendance/today/${employeeId}`)
 *   return data.record
 */
async function getEmployeeAttendanceToday(employeeId) {
  await simulateDelay(150)

  return dummyRecords.find((record) => record.employeeId === employeeId) || null
}

// ─── Actions ─────────────────────────────────

/**
 * Record check-in for an employee.
 *
 * @param {{ employeeId: string, method?: string }} payload
 * @returns {Promise<object>} — the created attendance record
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch('/api/attendance/check-in', {
 *     method: 'POST',
 *     body: payload,
 *   })
 *   return data.record
 */
async function checkIn(payload) {
  return submitAttendance('/api/attendance/check-in', payload)
}

/**
 * Record check-out for an employee.
 *
 * @param {{ employeeId: string, attendanceId?: string }} payload
 * @returns {Promise<object>} — the updated attendance record
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch('/api/attendance/check-out', {
 *     method: 'POST',
 *     body: payload,
 *   })
 *   return data.record
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
 *
 * ⚠️ MOCK — replace with:
 *   const params = new URLSearchParams(filters).toString()
 *   const data = await apiFetch(`/api/attendance/report?${params}`)
 *   return data.report
 */
async function getAttendanceReport(filters = {}) {
  void filters

  await simulateDelay(400)

  // Mock: return static report data regardless of filters
  return [...dummyReport]
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
