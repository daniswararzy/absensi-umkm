const { supabase } = require('../config')

const EMPLOYEE_STATUSES = ['Aktif', 'Nonaktif']

function createHttpError(message, statusCode) {
  const err = new Error(message)
  err.statusCode = statusCode

  return err
}

function toFrontend(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.nama,
    role: row.jabatan,
    phone: row.telepon || '',
    address: row.alamat || '',
    status: row.status,
    createdAt: row.created_at,
  }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function requireText(value, label) {
  const normalized = normalizeString(value)

  if (!normalized) {
    throw createHttpError(`${label} wajib diisi`, 400)
  }

  return normalized
}

function optionalText(value) {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = normalizeString(value)

  return normalized || null
}

function normalizeEmployeeId(id) {
  return requireText(id, 'ID pegawai')
}

function normalizeStatus(value, fallback = 'Aktif') {
  const status = value === undefined || value === null
    ? fallback
    : normalizeString(value)

  if (!EMPLOYEE_STATUSES.includes(status)) {
    throw createHttpError('Status pegawai harus Aktif atau Nonaktif', 400)
  }

  return status
}

function normalizeStatusFilter(value) {
  if (!value) {
    return ''
  }

  return normalizeStatus(value)
}

function buildCreateRow(input = {}) {
  return {
    id: normalizeEmployeeId(input.id),
    nama: requireText(input.name, 'Nama pegawai'),
    jabatan: requireText(input.role, 'Jabatan'),
    telepon: requireText(input.phone, 'Nomor telepon'),
    alamat: optionalText(input.address),
    status: normalizeStatus(input.status),
  }
}

function buildUpdateRow(input = {}) {
  const updates = {}

  if (input.name !== undefined) {
    updates.nama = requireText(input.name, 'Nama pegawai')
  }

  if (input.role !== undefined) {
    updates.jabatan = requireText(input.role, 'Jabatan')
  }

  if (input.phone !== undefined) {
    updates.telepon = requireText(input.phone, 'Nomor telepon')
  }

  if (input.address !== undefined) {
    updates.alamat = optionalText(input.address)
  }

  if (input.status !== undefined) {
    updates.status = normalizeStatus(input.status)
  }

  return updates
}

function applyFilters(employees, filters = {}) {
  let result = employees
  const search = normalizeString(filters.search).toLowerCase()
  const status = normalizeStatusFilter(filters.status)

  if (search) {
    result = result.filter((employee) => {
      const searchable = [
        employee.id,
        employee.name,
        employee.role,
        employee.phone,
      ].join(' ').toLowerCase()

      return searchable.includes(search)
    })
  }

  if (status) {
    result = result.filter((employee) => employee.status === status)
  }

  return result
}

function requireSupabase() {
  if (!supabase) {
    throw createHttpError('Database belum dikonfigurasi', 503)
  }
}

async function getAll(filters = {}) {
  requireSupabase()

  const { data, error } = await supabase
    .from('pegawai')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw createHttpError('Gagal mengambil data pegawai', 500)
  }

  return applyFilters(data.map(toFrontend), filters)
}

async function getById(id) {
  requireSupabase()
  const employeeId = normalizeEmployeeId(id)

  const { data, error } = await supabase
    .from('pegawai')
    .select('*')
    .eq('id', employeeId)
    .single()

  if (error || !data) {
    throw createHttpError('Pegawai tidak ditemukan', 404)
  }

  return toFrontend(data)
}

async function create(input) {
  requireSupabase()

  const row = buildCreateRow(input)

  const { data, error } = await supabase
    .from('pegawai')
    .insert(row)
    .select()
    .single()

  if (error) {
    // Duplicate PK
    if (error.code === '23505') {
      throw createHttpError(`ID pegawai "${row.id}" sudah digunakan`, 409)
    }

    throw createHttpError('Gagal menambahkan pegawai', 500)
  }

  return toFrontend(data)
}

async function update(id, input) {
  requireSupabase()
  const employeeId = normalizeEmployeeId(id)

  const updates = buildUpdateRow(input)

  if (Object.keys(updates).length === 0) {
    throw createHttpError('Tidak ada data yang diperbarui', 400)
  }

  const { data, error } = await supabase
    .from('pegawai')
    .update(updates)
    .eq('id', employeeId)
    .select()
    .single()

  if (error || !data) {
    const statusCode = error?.code === 'PGRST116' ? 404 : 500
    const message = statusCode === 404
      ? 'Pegawai tidak ditemukan'
      : 'Gagal memperbarui data pegawai'

    throw createHttpError(message, statusCode)
  }

  return toFrontend(data)
}

async function remove(id) {
  requireSupabase()
  const employeeId = normalizeEmployeeId(id)

  const { data, error } = await supabase
    .from('pegawai')
    .delete()
    .eq('id', employeeId)
    .select('id')
    .single()

  if (error || !data) {
    const statusCode = error?.code === 'PGRST116' ? 404 : 500
    const message = statusCode === 404
      ? 'Pegawai tidak ditemukan'
      : 'Gagal menghapus pegawai'

    throw createHttpError(message, statusCode)
  }

  return { deletedId: employeeId }
}

module.exports = { create, getAll, getById, remove, update }
