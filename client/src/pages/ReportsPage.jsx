import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, RotateCcw, Search } from 'lucide-react'
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
  const [filterDate, setFilterDate] = useState('')
  const [filterEmployeeId, setFilterEmployeeId] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [error, setError] = useState('')

  const fetchReports = useCallback(async (filters = {}) => {
    setError('')

    try {
      const data = await reportService.getReports(filters)

      setReports(data)
    } catch (err) {
      setReports([])
      setError(err.message || 'Gagal mengambil data laporan')
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  function handleSearch() {
    const nextFilters = {
      tanggal: filterDate || undefined,
      pegawai_id: filterEmployeeId.trim() || undefined,
    }

    setActiveFilters(nextFilters)
    setIsSearching(true)
    fetchReports(nextFilters)
  }

  function handleReset() {
    setFilterDate('')
    setFilterEmployeeId('')
    setActiveFilters({})
    setIsSearching(true)
    fetchReports()
  }

  function handleRetry() {
    setIsSearching(true)
    fetchReports(activeFilters)
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
          <div className="mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-3">
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
        description="Persempit data berdasarkan tanggal atau ID pegawai."
        title="Filter laporan"
      >
        <div className="mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Input
            id="report-date"
            label="Filter Tanggal"
            onChange={(event) => setFilterDate(event.target.value)}
            type="date"
            value={filterDate}
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
          <Table
            columns={reportColumns}
            data={reports}
            emptyMessage="Data laporan tidak ditemukan"
            getRowKey={(row) => row.id}
          />
        )}
      </Card>
    </>
  )
}

export default ReportsPage
