/**
 * employeeService.js — employee data service layer.
 *
 * Encapsulates ALL employee-related data operations.
 * Pages should call these functions instead of importing
 * dummyData directly.
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
 * The function signatures stay the same, so pages and
 * components require zero changes.
 * ──────────────────────────────────────────────
 */

import { employees as dummyEmployees, getEmployeeById as dummyGetById } from '../data/dummyData'
// import { apiFetch } from './apiClient'  // ← uncomment for real API

// ─── Helpers ─────────────────────────────────

function simulateDelay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200))
}

// ─── Read ────────────────────────────────────

/**
 * Fetch all employees.
 *
 * @param {{ search?: string, status?: string }} [filters]
 * @returns {Promise<object[]>}
 *
 * ⚠️ MOCK — replace with:
 *   const params = new URLSearchParams(filters).toString()
 *   const data = await apiFetch(`/api/employees?${params}`)
 *   return data.employees
 */
async function getEmployees(filters = {}) {
  await simulateDelay()

  let result = [...dummyEmployees]

  if (filters.search) {
    const query = filters.search.toLowerCase()

    result = result.filter(
      (employee) =>
        employee.name.toLowerCase().includes(query) ||
        employee.id.toLowerCase().includes(query),
    )
  }

  if (filters.status) {
    result = result.filter((employee) => employee.status === filters.status)
  }

  return result
}

/**
 * Fetch a single employee by ID.
 *
 * @param {string} employeeId
 * @returns {Promise<object|null>}
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch(`/api/employees/${employeeId}`)
 *   return data.employee
 */
async function getEmployeeById(employeeId) {
  await simulateDelay(150)

  return dummyGetById(employeeId) || null
}

// ─── Create ──────────────────────────────────

/**
 * Create a new employee.
 *
 * @param {object} employeeData — { name, role, phone, address, status }
 * @returns {Promise<object>} — the created employee
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch('/api/employees', {
 *     method: 'POST',
 *     body: employeeData,
 *   })
 *   return data.employee
 */
async function createEmployee(employeeData) {
  await simulateDelay(400)

  const newEmployee = {
    ...employeeData,
    id: `PGW-${String(dummyEmployees.length + 1).padStart(3, '0')}`,
    faceStatus: 'Belum',
    joinedAt: new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }

  // In mock mode we don't actually persist
  return newEmployee
}

// ─── Update ──────────────────────────────────

/**
 * Update an existing employee.
 *
 * @param {string} employeeId
 * @param {object} updates — partial employee data
 * @returns {Promise<object>} — the updated employee
 *
 * ⚠️ MOCK — replace with:
 *   const data = await apiFetch(`/api/employees/${employeeId}`, {
 *     method: 'PUT',
 *     body: updates,
 *   })
 *   return data.employee
 */
async function updateEmployee(employeeId, updates) {
  await simulateDelay(400)

  const existing = dummyGetById(employeeId)

  if (!existing) {
    throw new Error('Pegawai tidak ditemukan')
  }

  return { ...existing, ...updates }
}

// ─── Delete ──────────────────────────────────

/**
 * Delete an employee.
 *
 * @param {string} employeeId
 * @returns {Promise<{ success: boolean }>}
 *
 * ⚠️ MOCK — replace with:
 *   return apiFetch(`/api/employees/${employeeId}`, {
 *     method: 'DELETE',
 *   })
 */
async function deleteEmployee(employeeId) {
  await simulateDelay(300)

  const existing = dummyGetById(employeeId)

  if (!existing) {
    throw new Error('Pegawai tidak ditemukan')
  }

  return { success: true }
}

// ─── Public API ──────────────────────────────

export {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
}
