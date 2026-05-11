import { apiFetch } from './apiClient'

function buildPegawaiPath(filters = {}) {
  const query = new URLSearchParams()

  if (filters.search) {
    query.set('search', filters.search)
  }

  if (filters.status) {
    query.set('status', filters.status)
  }

  const queryString = query.toString()

  return queryString ? `/api/pegawai?${queryString}` : '/api/pegawai'
}

function requireEmployeeId(employeeId) {
  if (!employeeId) {
    throw new Error('ID pegawai wajib diisi')
  }

  return encodeURIComponent(employeeId)
}

function getResponseData(response) {
  if (!response?.success || !response.data) {
    throw new Error('Format response pegawai tidak valid')
  }

  return response.data
}

/**
 * Fetch all employees.
 *
 * @param {{ search?: string, status?: string }} [filters]
 * @returns {Promise<object[]>}
 */
async function getEmployees(filters = {}) {
  const response = await apiFetch(buildPegawaiPath(filters))
  const employees = getResponseData(response).employees

  if (!Array.isArray(employees)) {
    throw new Error('Format data pegawai tidak valid')
  }

  return employees
}

/**
 * Fetch a single employee by ID.
 *
 * @param {string} employeeId
 * @returns {Promise<object|null>}
 */
async function getEmployeeById(employeeId) {
  const response = await apiFetch(`/api/pegawai/${requireEmployeeId(employeeId)}`)

  return getResponseData(response).employee
}

/**
 * Create a new employee.
 *
 * @param {object} employeeData — { id, name, role, phone, address, status }
 * @returns {Promise<object>} — the created employee
 */
async function createEmployee(employeeData) {
  const response = await apiFetch('/api/pegawai', {
    method: 'POST',
    body: employeeData,
  })

  return getResponseData(response).employee
}

/**
 * Update an existing employee.
 *
 * @param {string} employeeId
 * @param {object} updates — partial employee data
 * @returns {Promise<object>} — the updated employee
 */
async function updateEmployee(employeeId, updates) {
  const response = await apiFetch(`/api/pegawai/${requireEmployeeId(employeeId)}`, {
    method: 'PUT',
    body: updates,
  })

  return getResponseData(response).employee
}

/**
 * Delete an employee.
 *
 * @param {string} employeeId
 * @returns {Promise<{ success: boolean }>}
 */
async function deleteEmployee(employeeId) {
  const response = await apiFetch(`/api/pegawai/${requireEmployeeId(employeeId)}`, {
    method: 'DELETE',
  })

  return getResponseData(response)
}

export {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
}
