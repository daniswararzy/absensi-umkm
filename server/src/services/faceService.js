const { supabase } = require('../config')

const DESCRIPTOR_LENGTH = 128
const DEFAULT_MATCH_THRESHOLD = 0.6

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

function normalizeEmployeeId(employeeId) {
  const id = typeof employeeId === 'string' ? employeeId.trim() : ''

  if (!id) {
    throw createHttpError('ID pegawai wajib diisi', 400)
  }

  return id
}

function normalizeDescriptor(descriptor) {
  if (!Array.isArray(descriptor) || descriptor.length !== DESCRIPTOR_LENGTH) {
    throw createHttpError('Descriptor wajah tidak valid', 400)
  }

  if (descriptor.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
    throw createHttpError('Descriptor wajah berisi nilai tidak valid', 400)
  }

  return descriptor
}

function mapFaceRows(rows = []) {
  return new Map(rows.map((row) => [row.pegawai_id, row]))
}

function toFaceStatus(employee, faceMap) {
  const faceData = faceMap.get(employee.id)

  return {
    id: employee.id,
    name: employee.nama,
    role: employee.jabatan,
    faceStatus: faceData?.status || 'Belum',
    registeredAt: faceData?.updated_at || faceData?.created_at || null,
  }
}

function parseStoredDescriptor(value) {
  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed) || parsed.length !== DESCRIPTOR_LENGTH) {
      return null
    }

    return parsed.every((item) => typeof item === 'number' && Number.isFinite(item))
      ? parsed
      : null
  } catch {
    return null
  }
}

function calculateDistance(left, right) {
  let sum = 0

  for (let index = 0; index < DESCRIPTOR_LENGTH; index += 1) {
    const diff = left[index] - right[index]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

async function ensureEmployeeExists(employeeId) {
  const { data, error } = await supabase
    .from('pegawai')
    .select('id, nama, jabatan')
    .eq('id', employeeId)
    .single()

  if (error || !data) {
    throw createHttpError('Pegawai tidak ditemukan', 404)
  }

  return data
}

async function verifyFace(payload = {}) {
  requireSupabase()

  const descriptor = normalizeDescriptor(payload.descriptor)
  const threshold = Number(payload.threshold) || DEFAULT_MATCH_THRESHOLD

  const { data: faceRows, error: faceError } = await supabase
    .from('data_wajah')
    .select('pegawai_id, face_encoding, status')
    .eq('status', 'Terdaftar')

  if (faceError) {
    throw createHttpError('Gagal mengambil data wajah', 500)
  }

  const candidates = (faceRows || [])
    .map((row) => ({
      pegawaiId: row.pegawai_id,
      descriptor: parseStoredDescriptor(row.face_encoding),
    }))
    .filter((candidate) => candidate.descriptor)

  if (candidates.length === 0) {
    return {
      matched: false,
      message: 'Belum ada data wajah valid yang terdaftar',
      threshold,
    }
  }

  let bestMatch = null

  for (const candidate of candidates) {
    const distance = calculateDistance(descriptor, candidate.descriptor)

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { ...candidate, distance }
    }
  }

  if (!bestMatch || bestMatch.distance > threshold) {
    return {
      matched: false,
      distance: bestMatch?.distance ?? null,
      message: 'Wajah tidak cocok dengan data pegawai',
      threshold,
    }
  }

  const employee = await ensureEmployeeExists(bestMatch.pegawaiId)

  return {
    matched: true,
    employee: {
      id: employee.id,
      name: employee.nama,
      role: employee.jabatan,
    },
    employeeId: employee.id,
    employeeName: employee.nama,
    distance: bestMatch.distance,
    threshold,
  }
}

async function getRegistrationStatus() {
  requireSupabase()

  const { data: employees, error: employeeError } = await supabase
    .from('pegawai')
    .select('id, nama, jabatan')
    .order('created_at', { ascending: true })

  if (employeeError) {
    throw createHttpError('Gagal mengambil data pegawai', 500)
  }

  const { data: faceRows, error: faceError } = await supabase
    .from('data_wajah')
    .select('pegawai_id, status, created_at, updated_at')

  if (faceError) {
    throw createHttpError('Gagal mengambil status data wajah', 500)
  }

  const faceMap = mapFaceRows(faceRows || [])

  return (employees || []).map((employee) => toFaceStatus(employee, faceMap))
}

async function getEmployeeFaceStatus(employeeId) {
  requireSupabase()

  const normalizedEmployeeId = normalizeEmployeeId(employeeId)
  const employee = await ensureEmployeeExists(normalizedEmployeeId)

  const { data, error } = await supabase
    .from('data_wajah')
    .select('pegawai_id, status, created_at, updated_at')
    .eq('pegawai_id', normalizedEmployeeId)
    .maybeSingle()

  if (error) {
    throw createHttpError('Gagal mengambil status data wajah', 500)
  }

  return toFaceStatus(employee, data ? mapFaceRows([data]) : new Map())
}

async function registerFace(payload = {}) {
  const requestPayload = payload && typeof payload === 'object' ? payload : {}
  const employeeId = normalizeEmployeeId(requestPayload.employeeId)
  const descriptor = normalizeDescriptor(requestPayload.descriptor)

  requireSupabase()

  const employee = await ensureEmployeeExists(employeeId)
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('data_wajah')
    .upsert(
      {
        pegawai_id: employeeId,
        face_encoding: JSON.stringify(descriptor),
        status: 'Terdaftar',
        updated_at: now,
      },
      { onConflict: 'pegawai_id' },
    )
    .select('pegawai_id, face_encoding, status, created_at, updated_at')
    .single()

  if (error) {
    throw createHttpError('Gagal menyimpan data wajah', 500)
  }

  const savedDescriptor = parseStoredDescriptor(data.face_encoding)

  if (!savedDescriptor) {
    throw createHttpError('Data wajah tersimpan tidak valid', 500)
  }

  return {
    employee: toFaceStatus(employee, mapFaceRows([data])),
    descriptorLength: savedDescriptor.length,
    message: `Data wajah ${employee.nama} berhasil disimpan`,
  }
}

module.exports = {
  getEmployeeFaceStatus,
  getRegistrationStatus,
  registerFace,
  verifyFace,
}
