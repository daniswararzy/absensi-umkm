import { apiFetch } from './apiClient'

function buildLaporanPath(filters = {}) {
  const query = new URLSearchParams()

  if (filters.tanggal) {
    query.set('tanggal', filters.tanggal)
  }

  if (filters.pegawai_id) {
    query.set('pegawai_id', filters.pegawai_id)
  }

  const queryString = query.toString()

  return queryString ? `/api/laporan?${queryString}` : '/api/laporan'
}

function getResponseData(response) {
  if (!response?.success || !response.data) {
    throw new Error('Format response laporan tidak valid')
  }

  return response.data
}

async function getReports(filters = {}) {
  const response = await apiFetch(buildLaporanPath(filters))
  const reports = getResponseData(response).reports

  if (!Array.isArray(reports)) {
    throw new Error('Format data laporan tidak valid')
  }

  return reports
}

export { getReports }
