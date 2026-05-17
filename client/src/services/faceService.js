import { apiFetch } from './apiClient'

const DESCRIPTOR_LENGTH = 128

function getResponseData(response) {
  if (!response?.success || !response.data) {
    throw new Error('Format response data wajah tidak valid')
  }

  return response.data
}

function createServiceError(error, message) {
  const nextError = new Error(message)

  nextError.status = error?.status
  nextError.data = error?.data

  return nextError
}

function getFaceErrorMessage(error) {
  if (error?.status === 0) {
    return 'Koneksi bermasalah atau server tidak merespons. Silakan coba lagi.'
  }

  if (error?.status >= 500) {
    return 'Server sedang bermasalah. Silakan coba lagi.'
  }

  const message = error?.message || ''

  if (message.toLowerCase().includes('pegawai tidak ditemukan')) {
    return 'Pegawai tidak ditemukan.'
  }

  if (message.toLowerCase().includes('wajah tidak cocok')) {
    return 'Wajah tidak cocok dengan data pegawai yang terdaftar.'
  }

  return message || 'Verifikasi gagal'
}

function normalizeVerifiedEmployee(data = {}) {
  const employee = data.pegawai || data.employee || {}
  const id = employee.id || data.employeeId || data.pegawai_id || data.id || ''
  const name = employee.nama || employee.name || data.employeeName || data.nama || ''
  const code = employee.kode_pegawai || employee.employee_code || data.kode_pegawai || data.code || ''

  if (!id && !name) {
    return null
  }

  return {
    ...employee,
    id,
    name,
    code,
  }
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
  try {
    const response = await apiFetch('/api/face/verify', {
      method: 'POST',
      auth: false,
      body: {
        ...payload,
        descriptor: normalizeDescriptor(payload?.descriptor),
      },
    })
    const data = getResponseData(response)
    const employee = normalizeVerifiedEmployee(data)

    if (!data.matched) {
      return {
        ...data,
        employee: null,
        employeeId: data.employeeId || '',
        employeeName: data.employeeName || '',
        message: 'Wajah tidak cocok dengan data pegawai yang terdaftar.',
      }
    }

    return {
      ...data,
      employee,
      employeeId: employee?.id || data.employeeId || '',
      employeeName: employee?.name || data.employeeName || '',
    }
  } catch (error) {
    throw createServiceError(error, getFaceErrorMessage(error))
  }
}

export {
  deleteFaceData,
  getEmployeeFaceStatus,
  getFaceRegistrationStatus,
  saveFaceData,
  verifyFace,
}
