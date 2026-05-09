/**
 * faceService.js — face recognition service layer.
 *
 * Encapsulates ALL face-related data operations:
 *   - face registration status
 *   - face capture / save
 *   - face verification (for attendance)
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

import { employees as dummyEmployees } from '../data/dummyData'
// import { apiFetch } from './apiClient'  // ← uncomment for real API

// ─── Helpers ─────────────────────────────────

function simulateDelay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200))
}

// ─── Registration Status ─────────────────────

/**
 * Fetch face registration status for all employees.
 *
 * @returns {Promise<object[]>} — list of { id, name, role, faceStatus }
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch('/api/face/status')
 *   return data.employees
 */
async function getFaceRegistrationStatus() {
  await simulateDelay()

  return dummyEmployees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    role: employee.role,
    faceStatus: employee.faceStatus,
  }))
}

/**
 * Get face registration status for a single employee.
 *
 * @param {string} employeeId
 * @returns {Promise<{ id: string, name: string, faceStatus: string } | null>}
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch(`/api/face/status/${employeeId}`)
 *   return data.employee
 */
async function getEmployeeFaceStatus(employeeId) {
  await simulateDelay(150)

  const employee = dummyEmployees.find((emp) => emp.id === employeeId)

  if (!employee) {
    return null
  }

  return {
    id: employee.id,
    name: employee.name,
    faceStatus: employee.faceStatus,
  }
}

// ─── Capture & Save ──────────────────────────

/**
 * Save captured face data for an employee.
 *
 * In the real implementation this would upload face
 * encoding data to the server for storage.
 *
 * @param {{ employeeId: string, faceData?: any }} payload
 * @returns {Promise<{ success: boolean, message: string }>}
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch('/api/face/register', {
 *     method: 'POST',
 *     body: payload,
 *   })
 *   return data
 */
async function saveFaceData(payload) {
  await simulateDelay(800)

  if (!payload.employeeId) {
    throw new Error('ID pegawai wajib diisi')
  }

  const employee = dummyEmployees.find((emp) => emp.id === payload.employeeId)

  if (!employee) {
    throw new Error('Pegawai tidak ditemukan')
  }

  // Mock: always succeed
  return {
    success: true,
    message: `Data wajah ${employee.name} berhasil disimpan`,
  }
}

/**
 * Delete face data for an employee.
 *
 * @param {string} employeeId
 * @returns {Promise<{ success: boolean }>}
 *
 * ⚠️ MOCK — replace with:
 *   return apiFetch(`/api/face/${employeeId}`, {
 *     method: 'DELETE',
 *   })
 */
async function deleteFaceData(employeeId) {
  await simulateDelay(400)

  return { success: true }
}

// ─── Verification ────────────────────────────

/**
 * Verify a face against stored face data.
 *
 * In the real implementation this would send a captured
 * frame/encoding to the server for matching.
 *
 * @param {{ faceData: any }} payload — captured face data to verify
 * @returns {Promise<{ matched: boolean, employeeId?: string, employeeName?: string, confidence?: number }>}
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch('/api/face/verify', {
 *     method: 'POST',
 *     body: payload,
 *   })
 *   return data
 */
async function verifyFace(payload) {
  await simulateDelay(600)

  // Mock: always match the first employee
  const employee = dummyEmployees[0]

  return {
    matched: true,
    employeeId: employee.id,
    employeeName: employee.name,
    confidence: 0.97,
  }
}

// ─── Public API ──────────────────────────────

export {
  deleteFaceData,
  getEmployeeFaceStatus,
  getFaceRegistrationStatus,
  saveFaceData,
  verifyFace,
}
