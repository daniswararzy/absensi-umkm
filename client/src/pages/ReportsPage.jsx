import { useEffect, useState } from 'react'
import { ClipboardList, Download, Printer, RotateCcw, Search } from 'lucide-react'
import { Button, Card, Input, PageHeader, Skeleton, StatusBadge, Table } from '../components/ui'
import { attendanceRecords } from '../data/dummyData'

const reportRows = attendanceRecords.map((record) => ({
  ...record,
  note:
    record.status === 'Hadir'
      ? 'Tepat waktu'
      : record.status === 'Terlambat'
        ? 'Masuk melewati batas waktu'
        : record.status,
}))

const reportColumns = [
  { key: 'date', header: 'Tanggal' },
  { key: 'employeeName', header: 'Nama Pegawai' },
  { key: 'checkIn', header: 'Jam Masuk' },
  { key: 'checkOut', header: 'Jam Pulang' },
  {
    key: 'status',
    header: 'Status Kehadiran',
    render: (row) => <StatusBadge tone={getReportTone(row.status)}>{row.status}</StatusBadge>,
  },
  { key: 'note', header: 'Keterangan' },
]

function getReportTone(status) {
  if (status === 'Terlambat' || status === 'Cuti') {
    return 'warning'
  }

  if (status === 'Belum Absen') {
    return 'danger'
  }

  return 'success'
}

function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // Simulate initial report data fetch
    const timer = setTimeout(() => setIsLoading(false), 900)

    return () => clearTimeout(timer)
  }, [])

  function handleSearch() {
    setIsSearching(true)
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 600)
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          actions={
            <div className="flex gap-2.5">
              <Skeleton variant="card" className="!h-[46px] !w-[150px]" />
              <Skeleton variant="card" className="!h-[46px] !w-[140px]" />
            </div>
          }
          icon={ClipboardList}
          description="Tinjau rekap kehadiran dan siapkan laporan untuk kebutuhan operasional."
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
        actions={
          <>
            <Button icon={Printer} variant="secondary">
              Cetak Laporan
            </Button>
            <Button icon={Download}>Ekspor Data</Button>
          </>
        }
        icon={ClipboardList}
        description="Tinjau rekap kehadiran dan siapkan laporan untuk kebutuhan operasional."
        status="Laporan berhasil dimuat"
        title="Laporan Kehadiran"
      />

      <Card
        description="Persempit data berdasarkan tanggal atau nama pegawai."
        title="Filter laporan"
      >
        <div className="mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Input id="report-date" label="Filter Tanggal" placeholder="Pilih tanggal" />
          <Input id="report-employee" label="Pilih Pegawai" placeholder="Semua pegawai" />
          <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
            <Button
              icon={Search}
              isLoading={isSearching}
              loadingText="Mencari..."
              onClick={handleSearch}
            >
              Cari Data
            </Button>
            <Button icon={RotateCcw} variant="secondary">
              Reset Filter
            </Button>
          </div>
        </div>
      </Card>

      <Card
        description="Data laporan tidak ditemukan akan ditampilkan saat filter tidak memiliki hasil."
        title="Laporan Kehadiran"
      >
        <Table
          columns={reportColumns}
          data={reportRows}
          emptyMessage="Data laporan tidak ditemukan"
          getRowKey={(row) => row.id}
        />
      </Card>
    </>
  )
}

export default ReportsPage
