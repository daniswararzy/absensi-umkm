import { apiFetch } from './apiClient'

const DESCRIPTOR_LENGTH = 128

function getResponseData(response) {
  if (!response?.success || !response.data) {
    throw new Error('Format response data wajah tidak valid')
  }

  return response.data
}

function normalizeDescriptor(descriptor) {
  if (!Array.isArray(descriptor) || descriptor.length !== DESCRIPTOR_LENGTH) {
    throw new Error('Descriptor wajah harus berisi 128 angka')
  }

  if (descriptor.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
    throw new Error('Descriptor wajah berisi nilai tidak valid')
  }

  return descriptor
}

function requireEmployeeId(employeeId) {
  if (!employeeId) {
    throw new Error('ID pegawai wajib diisi')
  }

  return encodeURIComponent(employeeId)
}

async function getFaceRegistrationStatus() {
  const response = await apiFetch('/api/face/status')
  const employees = getResponseData(response).employees

  if (!Array.isArray(employees)) {
    throw new Error('Format status data wajah tidak valid')
  }

  return employees
}

async function getEmployeeFaceStatus(employeeId) {
  const response = await apiFetch(
    `/api/face/status/${requireEmployeeId(employeeId)}`,
  )

  return getResponseData(response).employee
}

async function saveFaceData(payload) {
  const employeeId = payload?.employeeId

  if (!employeeId) {
    throw new Error('ID pegawai wajib diisi')
  }

  const response = await apiFetch('/api/face/register', {
    method: 'POST',
    body: {
      employeeId,
      descriptor: normalizeDescriptor(payload?.descriptor),
    },
  })

  return getResponseData(response)
}

async function deleteFaceData() {
  throw new Error('Hapus data wajah belum tersedia')
}

async function verifyFace(payload) {
  const response = await apiFetch('/api/face/verify', {
    method: 'POST',
    body: payload,
  })

  return getResponseData(response)
}

export {
  deleteFaceData,
  getEmployeeFaceStatus,
  getFaceRegistrationStatus,
  saveFaceData,
  verifyFace,
}
