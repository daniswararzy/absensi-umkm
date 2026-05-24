const { supabase } = require('../config')

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const ACTIVE_EMPLOYEE_STATUS = 'Aktif'
const DEFAULT_ATTENDANCE_STATUS = 'Belum Absen'
const MAX_REPORT_RANGE_DAYS = 31

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
  const tanggalMulai = normalizeString(filters.tanggal_mulai)
  const tanggalSelesai = normalizeString(filters.tanggal_selesai)
  const pegawaiId = normalizeString(filters.pegawai_id)

  if (tanggal && !DATE_PATTERN.test(tanggal)) {
    throw createHttpError('Format tanggal harus YYYY-MM-DD', 400)
  }

  if (tanggalMulai && !DATE_PATTERN.test(tanggalMulai)) {
    throw createHttpError('Format tanggal mulai harus YYYY-MM-DD', 400)
  }

  if (tanggalSelesai && !DATE_PATTERN.test(tanggalSelesai)) {
    throw createHttpError('Format tanggal selesai harus YYYY-MM-DD', 400)
  }

  const resolvedTanggalMulai = tanggal ? '' : (tanggalMulai || tanggalSelesai)
  const resolvedTanggalSelesai = tanggal ? '' : (tanggalSelesai || tanggalMulai)

  if (resolvedTanggalMulai && resolvedTanggalSelesai && resolvedTanggalMulai > resolvedTanggalSelesai) {
    throw createHttpError('Tanggal mulai tidak boleh lebih besar dari tanggal selesai', 400)
  }

  return {
    pegawaiId,
    tanggal,
    tanggalMulai: resolvedTanggalMulai,
    tanggalSelesai: resolvedTanggalSelesai,
  }
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

function toMissingAttendanceReport(employee, tanggal) {
  return {
    id: `missing-${tanggal}-${employee.id}`,
    tanggal,
    jamMasuk: null,
    jamKeluar: null,
    status: DEFAULT_ATTENDANCE_STATUS,
    metode: '-',
    pegawaiId: employee.id,
    nama: employee.nama || 'Unknown',
    jabatan: employee.jabatan || '-',
  }
}

function toReport(row, pegawaiMap) {
  const pegawai = pegawaiMap.get(row.pegawai_id)

  return {
    id: row.id,
    tanggal: row.tanggal,
    jamMasuk: row.jam_masuk,
    jamKeluar: row.jam_keluar,
    status: row.status || DEFAULT_ATTENDANCE_STATUS,
    metode: row.metode || '-',
    pegawaiId: row.pegawai_id,
    nama: pegawai?.nama || 'Unknown',
    jabatan: pegawai?.jabatan || '-',
  }
}

function sortReports(first, second) {
  if (first.tanggal !== second.tanggal) {
    return second.tanggal.localeCompare(first.tanggal)
  }

  const firstTime = first.jamMasuk || '99:99:99'
  const secondTime = second.jamMasuk || '99:99:99'

  if (firstTime !== secondTime) {
    return firstTime.localeCompare(secondTime)
  }

  return first.nama.localeCompare(second.nama, 'id-ID')
}

function getDatesInRange(tanggalMulai, tanggalSelesai) {
  if (!tanggalMulai || !tanggalSelesai) {
    return []
  }

  const dates = []
  const cursor = new Date(`${tanggalMulai}T00:00:00.000Z`)
  const end = new Date(`${tanggalSelesai}T00:00:00.000Z`)

  while (cursor <= end) {
    if (dates.length >= MAX_REPORT_RANGE_DAYS) {
      throw createHttpError(`Rentang tanggal laporan maksimal ${MAX_REPORT_RANGE_DAYS} hari`, 400)
    }

    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
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

async function getActivePegawaiRows(pegawaiId) {
  let query = supabase
    .from('pegawai')
    .select('id, nama, jabatan')
    .eq('status', ACTIVE_EMPLOYEE_STATUS)
    .order('created_at', { ascending: true })

  if (pegawaiId) {
    query = query.eq('id', pegawaiId)
  }

  const { data, error } = await query

  if (error) {
    throw createHttpError('Gagal mengambil pegawai aktif untuk laporan', 500)
  }

  return data || []
}

async function getAttendanceRows({ pegawaiId, tanggal, tanggalMulai, tanggalSelesai }) {
  let query = supabase
    .from('absensi')
    .select('id, tanggal, jam_masuk, jam_keluar, status, metode, pegawai_id')
    .order('tanggal', { ascending: false })
    .limit(100)

  if (tanggal) {
    query = query.eq('tanggal', tanggal)
  } else {
    if (tanggalMulai) {
      query = query.gte('tanggal', tanggalMulai)
    }

    if (tanggalSelesai) {
      query = query.lte('tanggal', tanggalSelesai)
    }
  }

  if (pegawaiId) {
    query = query.eq('pegawai_id', pegawaiId)
  }

  const { data, error } = await query

  if (error) {
    throw createHttpError('Gagal mengambil data laporan', 500)
  }

  return data || []
}

async function getLaporan(filters = {}) {
  requireSupabase()

  const {
    pegawaiId,
    tanggal,
    tanggalMulai,
    tanggalSelesai,
  } = normalizeFilters(filters)
  const rangeDates = getDatesInRange(tanggalMulai, tanggalSelesai)
  const rows = await getAttendanceRows({
    pegawaiId,
    tanggal,
    tanggalMulai,
    tanggalSelesai,
  })
  const pegawaiIds = [...new Set(rows.map((row) => row.pegawai_id).filter(Boolean))]
  const pegawaiMap = await getPegawaiMap(pegawaiIds)
  const reports = rows.map((row) => toReport(row, pegawaiMap))

  if (!tanggal && rangeDates.length === 0) {
    return reports.sort(sortReports)
  }

  const activePegawaiRows = await getActivePegawaiRows(pegawaiId)
  const reportDates = tanggal ? [tanggal] : rangeDates
  const recordedKeys = new Set(rows.map((row) => `${row.tanggal}:${row.pegawai_id}`))
  const missingReports = reportDates.flatMap((reportDate) => (
    activePegawaiRows
      .filter((employee) => !recordedKeys.has(`${reportDate}:${employee.id}`))
      .map((employee) => toMissingAttendanceReport(employee, reportDate))
  ))

  return [...reports, ...missingReports].sort(sortReports)
}

module.exports = { getLaporan }
