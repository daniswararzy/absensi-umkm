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
  const response = await apiFetch('/api/attendance/check-in', {
    method: 'POST',
    body: payload,
  })

  if (!response?.success || !response.data?.record) {
    throw new Error('Format response absensi tidak valid')
  }

  return response.data.record
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
  const response = await apiFetch('/api/attendance/check-out', {
    method: 'POST',
    body: payload,
  })

  if (!response?.success || !response.data?.record) {
    throw new Error('Format response absensi tidak valid')
  }

  return response.data.record
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
