import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, Copy, Download, RotateCcw, Search } from 'lucide-react'
import {
  AlertBanner,
  Button,
  Card,
  Input,
  PageHeader,
  Skeleton,
  StatusBadge,
  Table,
} from '../components/ui'
import { reportService } from '../services'

const PAGE_SIZE = 10

function getReportNote(status) {
  if (status === 'Hadir') return 'Tepat waktu'
  if (status === 'Terlambat') return 'Masuk melewati batas waktu'
  if (status === 'Belum Absen') return 'Belum melakukan absensi'

  return status || '-'
}

function getReportTone(status) {
  if (status === 'Terlambat' || status === 'Cuti' || status === 'Izin') {
    return 'warning'
  }

  if (status === 'Belum Absen' || status === 'Alfa') {
    return 'danger'
  }

  return 'success'
}

function formatReportTime(value) {
  if (!value) {
    return '-'
  }

  return value.slice(0, 5)
}

function getJakartaDateKey() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

function getFilterValue(filters, key) {
  return typeof filters[key] === 'string' ? filters[key] : ''
}

function getReportScope(filters, reports) {
  const dateFilter = getFilterValue(filters, 'tanggal')
  const startDateFilter = getFilterValue(filters, 'tanggal_mulai')
  const endDateFilter = getFilterValue(filters, 'tanggal_selesai')
  const employeeFilter = getFilterValue(filters, 'pegawai_id')
  const dates = [
    ...new Set(reports.map((report) => report.tanggal).filter(Boolean)),
  ]
  const rangeLabel = startDateFilter && endDateFilter
    ? `${startDateFilter} sampai ${endDateFilter}`
    : ''
  const dateLabel = dateFilter || rangeLabel || (dates.length === 1 ? dates[0] : 'Semua tanggal')

  if (employeeFilter) {
    return `${dateLabel} - Pegawai ${employeeFilter}`
  }

  return dateLabel
}

function buildReportNote(reports, filters = {}) {
  const totalData = reports.length
  const hadir = reports.filter((report) => report.status === 'Hadir').length
  const terlambat = reports.filter((report) => report.status === 'Terlambat').length
  const pulang = reports.filter((report) => report.jamKeluar).length
  const belumAbsen = reports.filter((report) => (
    report.status === 'Belum Absen' || !report.jamMasuk
  )).length
  const belumLengkapPulang = reports.filter(
    (report) => report.jamMasuk && !report.jamKeluar,
  ).length
  const lines = [
    `Laporan Kehadiran ${getReportScope(filters, reports)}`,
    '',
    `Total data: ${totalData}`,
    `Hadir: ${hadir}`,
    `Terlambat: ${terlambat}`,
    `Pulang: ${pulang}`,
    `Belum Absen: ${belumAbsen}`,
    `Belum lengkap pulang: ${belumLengkapPulang}`,
    '',
    'Detail:',
  ]

  if (reports.length === 0) {
    lines.push('Tidak ada data laporan.')
  } else {
    reports.forEach((report) => {
      lines.push(
        `- ${report.nama || 'Unknown'} (${report.pegawaiId || '-'}): Masuk ${formatReportTime(report.jamMasuk)}, Pulang ${formatReportTime(report.jamKeluar)}, Status ${report.status || '-'}.`,
      )
    })
  }

  return lines.join('\n')
}

function toSafeFilePart(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function getReportDownloadName(filters = {}) {
  const date = toSafeFilePart(
    getFilterValue(filters, 'tanggal')
      || `${getFilterValue(filters, 'tanggal_mulai')}-sampai-${getFilterValue(filters, 'tanggal_selesai')}`,
  ) || 'semua-tanggal'
  const employee = toSafeFilePart(getFilterValue(filters, 'pegawai_id'))

  return employee
    ? `laporan-kehadiran-${date}-${employee}.txt`
    : `laporan-kehadiran-${date}.txt`
}

function getReportCsvDownloadName(filters = {}) {
  const date = toSafeFilePart(
    getFilterValue(filters, 'tanggal')
      || `${getFilterValue(filters, 'tanggal_mulai')}-sampai-${getFilterValue(filters, 'tanggal_selesai')}`,
  ) || 'semua-tanggal'
  const employee = toSafeFilePart(getFilterValue(filters, 'pegawai_id'))

  return employee
    ? `laporan-kehadiran-${date}-${employee}.csv`
    : `laporan-kehadiran-${date}.csv`
}

function escapeCsvValue(value) {
  const text = String(value ?? '')

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function buildReportCsv(reports) {
  const headers = [
    'Tanggal',
    'ID Pegawai',
    'Nama Pegawai',
    'Jam Masuk',
    'Jam Pulang',
    'Status Kehadiran',
    'Keterangan',
  ]
  const rows = reports.map((report) => [
    report.tanggal || '-',
    report.pegawaiId || '-',
    report.nama || '-',
    formatReportTime(report.jamMasuk),
    formatReportTime(report.jamKeluar),
    report.status || '-',
    getReportNote(report.status),
  ])

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')
}

function copyTextFallback(text) {
  const textarea = document.createElement('textarea')

  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  const copied = document.execCommand('copy')

  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error('Browser tidak mengizinkan salin otomatis.')
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      copyTextFallback(text)
      return
    }
  }

  copyTextFallback(text)
}

const reportColumns = [
  { key: 'tanggal', header: 'Tanggal' },
  { key: 'pegawaiId', header: 'ID Pegawai' },
  { key: 'nama', header: 'Nama Pegawai' },
  {
    key: 'jamMasuk',
    header: 'Jam Masuk',
    render: (row) => row.jamMasuk || '-',
  },
  {
    key: 'jamKeluar',
    header: 'Jam Pulang',
    render: (row) => row.jamKeluar || '-',
  },
  {
    key: 'status',
    header: 'Status Kehadiran',
    render: (row) => (
      <StatusBadge tone={getReportTone(row.status)}>
        {row.status || '-'}
      </StatusBadge>
    ),
  },
  {
    key: 'note',
    header: 'Keterangan',
    render: (row) => getReportNote(row.status),
  },
]

function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [reports, setReports] = useState([])
  const [filterStartDate, setFilterStartDate] = useState(() => getJakartaDateKey())
  const [filterEndDate, setFilterEndDate] = useState(() => getJakartaDateKey())
  const [filterEmployeeId, setFilterEmployeeId] = useState('')
  const [activeFilters, setActiveFilters] = useState(() => ({
    tanggal_mulai: getJakartaDateKey(),
    tanggal_selesai: getJakartaDateKey(),
  }))
  const [error, setError] = useState('')
  const [noteFeedback, setNoteFeedback] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchReports = useCallback(async (filters = {}) => {
    setError('')
    setNoteFeedback(null)

    try {
      const data = await reportService.getReports(filters)

      setReports(data)
      setCurrentPage(1)
    } catch (err) {
      setReports([])
      setCurrentPage(1)
      setError(err.message || 'Gagal mengambil data laporan')
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const today = getJakartaDateKey()

    fetchReports({ tanggal_mulai: today, tanggal_selesai: today })
  }, [fetchReports])

  const reportNote = useMemo(
    () => buildReportNote(reports, activeFilters),
    [reports, activeFilters],
  )
  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE))
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE

    return reports.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, reports])
  const isNoteDisabled = Boolean(error) || isSearching
  const isExportDisabled = isNoteDisabled || reports.length === 0

  function handleSearch() {
    const normalizedStartDate = filterStartDate || filterEndDate
    const normalizedEndDate = filterEndDate || filterStartDate
    const nextFilters = {
      tanggal_mulai: normalizedStartDate || undefined,
      tanggal_selesai: normalizedEndDate || undefined,
      pegawai_id: filterEmployeeId.trim() || undefined,
    }

    if (
      nextFilters.tanggal_mulai
      && nextFilters.tanggal_selesai
      && nextFilters.tanggal_mulai > nextFilters.tanggal_selesai
    ) {
      setError('Tanggal mulai tidak boleh lebih besar dari tanggal selesai')
      return
    }

    setActiveFilters(nextFilters)
    setIsSearching(true)
    fetchReports(nextFilters)
  }

  function handleReset() {
    const today = getJakartaDateKey()
    const nextFilters = { tanggal_mulai: today, tanggal_selesai: today }

    setFilterStartDate(today)
    setFilterEndDate(today)
    setFilterEmployeeId('')
    setActiveFilters(nextFilters)
    setIsSearching(true)
    fetchReports(nextFilters)
  }

  function handleRetry() {
    setIsSearching(true)
    fetchReports(activeFilters)
  }

  async function handleCopyNote() {
    try {
      await copyTextToClipboard(reportNote)
      setNoteFeedback({
        message: 'Catatan laporan berhasil disalin.',
        tone: 'success',
      })
    } catch (err) {
      setNoteFeedback({
        message: err.message || 'Gagal menyalin catatan laporan.',
        tone: 'error',
      })
    }
  }

  function handleDownloadNote() {
    try {
      const blob = new Blob([reportNote], { type: 'text/plain;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = getReportDownloadName(activeFilters)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setNoteFeedback({
        message: 'Catatan laporan berhasil diunduh.',
        tone: 'success',
      })
    } catch (err) {
      setNoteFeedback({
        message: err.message || 'Gagal mengunduh catatan laporan.',
        tone: 'error',
      })
    }
  }

  function handleDownloadCsv() {
    try {
      const csv = buildReportCsv(reports)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = getReportCsvDownloadName(activeFilters)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setNoteFeedback({
        message: 'Laporan CSV berhasil diunduh.',
        tone: 'success',
      })
    } catch (err) {
      setNoteFeedback({
        message: err.message || 'Gagal mengunduh laporan CSV.',
        tone: 'error',
      })
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          description="Tinjau rekap kehadiran berdasarkan data absensi di database."
          icon={ClipboardList}
          title="Laporan Kehadiran"
        />
        <Card title="Filter laporan" description="Memuat filter...">
          <div className="mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton variant="card" className="!h-[70px]" />
            <Skeleton variant="card" className="!h-[70px]" />
            <Skeleton variant="card" className="!h-[70px]" />
            <Skeleton variant="card" className="!h-[46px]" />
          </div>
        </Card>
        <Card title="Laporan Kehadiran" description="Memuat data laporan...">
          <Skeleton variant="table-row" count={5} />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        description="Tinjau rekap kehadiran berdasarkan data absensi di database."
        icon={ClipboardList}
        status={error ? undefined : 'Laporan berhasil dimuat'}
        title="Laporan Kehadiran"
      />

      {error ? (
        <AlertBanner
          message={error}
          onDismiss={() => setError('')}
          tone="error"
        />
      ) : null}

      <Card
        description="Persempit data berdasarkan rentang tanggal atau ID pegawai."
        title="Filter laporan"
      >
        <div className="mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            id="report-start-date"
            label="Tanggal Mulai"
            onChange={(event) => setFilterStartDate(event.target.value)}
            type="date"
            value={filterStartDate}
          />
          <Input
            id="report-end-date"
            label="Tanggal Selesai"
            onChange={(event) => setFilterEndDate(event.target.value)}
            type="date"
            value={filterEndDate}
          />
          <Input
            id="report-employee"
            label="ID Pegawai"
            onChange={(event) => setFilterEmployeeId(event.target.value)}
            placeholder="Masukkan ID Pegawai"
            value={filterEmployeeId}
          />
          <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
            <Button
              icon={Search}
              isLoading={isSearching}
              loadingText="Mencari..."
              onClick={handleSearch}
            >
              Cari Data
            </Button>
            <Button
              disabled={isSearching}
              icon={RotateCcw}
              onClick={handleReset}
              variant="secondary"
            >
              Reset Filter
            </Button>
          </div>
        </div>
      </Card>

      <Card
        description="Data laporan diambil langsung dari tabel absensi dan pegawai."
        title="Laporan Kehadiran"
      >
        {error ? (
          <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
            <Button
              isLoading={isSearching}
              loadingText="Memuat..."
              onClick={handleRetry}
              variant="secondary"
            >
              Coba Lagi
            </Button>
          </div>
        ) : (
          <>
            <Table
              columns={reportColumns}
              data={paginatedReports}
              emptyMessage="Data laporan tidak ditemukan"
              getRowKey={(row) => row.id}
            />
            {reports.length > PAGE_SIZE ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-bold text-brand-brown-muted">
                  Menampilkan {paginatedReports.length} dari {reports.length} data
                  {' '}
                  - Halaman {currentPage} dari {totalPages}
                </span>
                <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
                  <Button
                    disabled={currentPage === 1 || isSearching}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    variant="secondary"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    disabled={currentPage === totalPages || isSearching}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    variant="secondary"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <Card
        actions={
          <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
            <Button
              disabled={isNoteDisabled}
              icon={Copy}
              onClick={handleCopyNote}
              variant="secondary"
            >
              Salin Catatan
            </Button>
            <Button
              disabled={isNoteDisabled}
              icon={Download}
              onClick={handleDownloadNote}
              variant="secondary"
            >
              Unduh .txt
            </Button>
            <Button
              disabled={isExportDisabled}
              icon={Download}
              onClick={handleDownloadCsv}
              variant="secondary"
            >
              Unduh CSV
            </Button>
          </div>
        }
        description="Ringkasan teks dari data laporan yang sedang tampil."
        title="Catatan Laporan"
      >
        {noteFeedback ? (
          <AlertBanner
            message={noteFeedback.message}
            onDismiss={() => setNoteFeedback(null)}
            tone={noteFeedback.tone}
          />
        ) : null}

        <textarea
          aria-label="Catatan laporan"
          className="min-h-[260px] w-full resize-y rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-4 font-mono text-sm font-semibold leading-6 text-brand-brown shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none"
          readOnly
          value={reportNote}
        />
      </Card>
    </>
  )
}

export default ReportsPage
