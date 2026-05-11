const { supabase } = require('../config')

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

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

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeFilters(filters = {}) {
  const tanggal = normalizeString(filters.tanggal)
  const pegawaiId = normalizeString(filters.pegawai_id)

  if (tanggal && !DATE_PATTERN.test(tanggal)) {
    throw createHttpError('Format tanggal harus YYYY-MM-DD', 400)
  }

  return { tanggal, pegawaiId }
}

function mapPegawaiById(rows = []) {
  return new Map(
    rows.map((row) => [
      row.id,
      {
        nama: row.nama || 'Unknown',
        jabatan: row.jabatan || '-',
      },
    ]),
  )
}

function toReport(row, pegawaiMap) {
  const pegawai = pegawaiMap.get(row.pegawai_id)

  return {
    id: row.id,
    tanggal: row.tanggal,
    jamMasuk: row.jam_masuk,
    jamKeluar: row.jam_keluar,
    status: row.status,
    metode: row.metode || '-',
    pegawaiId: row.pegawai_id,
    nama: pegawai?.nama || 'Unknown',
    jabatan: pegawai?.jabatan || '-',
  }
}

async function getPegawaiMap(pegawaiIds) {
  if (pegawaiIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('pegawai')
    .select('id, nama, jabatan')
    .in('id', pegawaiIds)

  if (error) {
    throw createHttpError('Gagal mengambil data pegawai untuk laporan', 500)
  }

  return mapPegawaiById(data || [])
}

async function getLaporan(filters = {}) {
  requireSupabase()

  const { tanggal, pegawaiId } = normalizeFilters(filters)

  let query = supabase
    .from('absensi')
    .select('id, tanggal, jam_masuk, jam_keluar, status, metode, pegawai_id')
    .order('tanggal', { ascending: false })
    .limit(100)

  if (tanggal) {
    query = query.eq('tanggal', tanggal)
  }

  if (pegawaiId) {
    query = query.eq('pegawai_id', pegawaiId)
  }

  const { data, error } = await query

  if (error) {
    throw createHttpError('Gagal mengambil data laporan', 500)
  }

  const rows = data || []
  const pegawaiIds = [...new Set(rows.map((row) => row.pegawai_id).filter(Boolean))]
  const pegawaiMap = await getPegawaiMap(pegawaiIds)

  return rows.map((row) => toReport(row, pegawaiMap))
}

module.exports = { getLaporan }
