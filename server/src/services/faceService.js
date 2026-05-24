const { supabase } = require('../config')

const DESCRIPTOR_LENGTH = 128
const DEFAULT_MATCH_THRESHOLD = 0.6
const ACTIVE_EMPLOYEE_STATUS = 'Aktif'

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
  if (!Array.isArray(descriptor)) {
    throw createHttpError('Descriptor wajah harus berupa array JSON', 400)
  }

  if (descriptor.length !== DESCRIPTOR_LENGTH) {
    throw createHttpError(`Descriptor wajah harus berisi ${DESCRIPTOR_LENGTH} angka`, 400)
  }

  return descriptor.map((value, index) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw createHttpError(`Descriptor wajah berisi nilai tidak valid pada index ${index}`, 400)
    }

    return value
  })
}

function normalizeThreshold(threshold) {
  if (threshold === undefined || threshold === null || threshold === '') {
    return DEFAULT_MATCH_THRESHOLD
  }

  const value = Number(threshold)

  if (!Number.isFinite(value) || value <= 0 || value > DEFAULT_MATCH_THRESHOLD) {
    throw createHttpError(
      `Threshold wajah harus berupa angka lebih dari 0 dan maksimal ${DEFAULT_MATCH_THRESHOLD}`,
      400,
    )
  }

  return value
}

function parseStoredDescriptor(value) {
  if (typeof value !== 'string') {
    return null
  }

  try {
    return normalizeDescriptor(JSON.parse(value))
  } catch {
    return null
  }
}

function serializeDescriptor(descriptor) {
  const normalizedDescriptor = normalizeDescriptor(descriptor)
  const encodedDescriptor = JSON.stringify(normalizedDescriptor)

  if (!parseStoredDescriptor(encodedDescriptor)) {
    throw createHttpError('Descriptor wajah gagal dikonversi ke JSON valid', 400)
  }

  return {
    encodedDescriptor,
    normalizedDescriptor,
  }
}

function assertValidRequestPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createHttpError('Payload registrasi wajah tidak valid', 400)
  }
}

function assertSavedDescriptor(value) {
  const savedDescriptor = parseStoredDescriptor(value)

  if (!savedDescriptor) {
    throw createHttpError('Data wajah tersimpan tidak valid', 500)
  }

  return savedDescriptor
}

function assertStoredDescriptorMatches(savedValue, expectedDescriptor) {
  const savedDescriptor = assertSavedDescriptor(savedValue)

  for (let index = 0; index < DESCRIPTOR_LENGTH; index += 1) {
    if (savedDescriptor[index] !== expectedDescriptor[index]) {
      throw createHttpError('Data wajah tersimpan tidak sesuai payload', 500)
    }
  }

  return savedDescriptor
}

function mapFaceRows(rows = []) {
  return new Map(rows.map((row) => [row.pegawai_id, row]))
}

function toFaceStatus(employee, faceMap) {
  const faceData = faceMap.get(employee.id)
  const hasValidDescriptor = Boolean(
    faceData?.status === 'Terdaftar' && parseStoredDescriptor(faceData.face_encoding),
  )

  return {
    id: employee.id,
    name: employee.nama,
    role: employee.jabatan,
    status: employee.status || ACTIVE_EMPLOYEE_STATUS,
    faceStatus: hasValidDescriptor ? 'Terdaftar' : 'Belum',
    registeredAt: hasValidDescriptor
      ? faceData.updated_at || faceData.created_at || null
      : null,
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

async function ensureEmployeeExists(employeeId, options = {}) {
  const {
    inactiveMessage = 'Pegawai nonaktif tidak dapat menggunakan fitur wajah',
    requireActive = false,
  } = options

  const { data, error } = await supabase
    .from('pegawai')
    .select('id, nama, jabatan, status')
    .eq('id', employeeId)
    .single()

  if (error || !data) {
    throw createHttpError('Pegawai tidak ditemukan', 404)
  }

  if (requireActive && data.status !== ACTIVE_EMPLOYEE_STATUS) {
    throw createHttpError(inactiveMessage, 403)
  }

  return data
}

async function verifyFace(payload = {}) {
  requireSupabase()

  const expectedEmployeeId = payload.employeeId
    ? normalizeEmployeeId(payload.employeeId)
    : ''
  const descriptor = normalizeDescriptor(payload.descriptor)
  const threshold = normalizeThreshold(payload.threshold)

  let faceQuery = supabase
    .from('data_wajah')
    .select('pegawai_id, face_encoding, status')
    .eq('status', 'Terdaftar')

  if (expectedEmployeeId) {
    await ensureEmployeeExists(expectedEmployeeId, {
      inactiveMessage: 'Pegawai nonaktif tidak dapat melakukan verifikasi wajah',
      requireActive: true,
    })
    faceQuery = faceQuery.eq('pegawai_id', expectedEmployeeId)
  }

  const { data: faceRows, error: faceError } = await faceQuery

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
      message: expectedEmployeeId
        ? 'Data wajah pegawai belum terdaftar'
        : 'Belum ada data wajah valid yang terdaftar',
      reason: 'not_registered',
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
      reason: 'not_matched',
      threshold,
    }
  }

  const employee = await ensureEmployeeExists(bestMatch.pegawaiId, {
    inactiveMessage: 'Pegawai nonaktif tidak dapat melakukan verifikasi wajah',
    requireActive: true,
  })

  return {
    matched: true,
    employee: {
      id: employee.id,
      name: employee.nama,
      role: employee.jabatan,
      status: employee.status,
    },
    employeeId: employee.id,
    employeeName: employee.nama,
    distance: bestMatch.distance,
    reason: 'matched',
    threshold,
  }
}

async function getRegistrationStatus() {
  requireSupabase()

  const { data: employees, error: employeeError } = await supabase
    .from('pegawai')
    .select('id, nama, jabatan, status')
    .order('created_at', { ascending: true })

  if (employeeError) {
    throw createHttpError('Gagal mengambil data pegawai', 500)
  }

  const { data: faceRows, error: faceError } = await supabase
    .from('data_wajah')
    .select('pegawai_id, face_encoding, status, created_at, updated_at')

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
    .select('pegawai_id, face_encoding, status, created_at, updated_at')
    .eq('pegawai_id', normalizedEmployeeId)
    .maybeSingle()

  if (error) {
    throw createHttpError('Gagal mengambil status data wajah', 500)
  }

  return toFaceStatus(employee, data ? mapFaceRows([data]) : new Map())
}

async function registerFace(payload = {}) {
  assertValidRequestPayload(payload)

  const employeeId = normalizeEmployeeId(payload.employeeId)
  const { encodedDescriptor, normalizedDescriptor } = serializeDescriptor(payload.descriptor)

  requireSupabase()

  const employee = await ensureEmployeeExists(employeeId, {
    inactiveMessage: 'Pegawai nonaktif tidak dapat didaftarkan wajah',
    requireActive: true,
  })
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('data_wajah')
    .upsert(
      {
        pegawai_id: employeeId,
        face_encoding: encodedDescriptor,
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

  const savedDescriptor = assertStoredDescriptorMatches(
    data.face_encoding,
    normalizedDescriptor,
  )

  return {
    employee: toFaceStatus(employee, mapFaceRows([data])),
    descriptorFormat: 'json-array',
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
