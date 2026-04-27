import { Button, Card, Input, PageHeader, StatusBadge, Table } from '../components/ui'
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
  return (
    <>
      <PageHeader
        actions={
          <>
            <Button variant="secondary">Cetak Laporan</Button>
            <Button>Ekspor Data</Button>
          </>
        }
        eyebrow="Laporan Kehadiran"
        status="Laporan berhasil dimuat"
        title="Laporan Kehadiran"
      />

      <Card title="Filter">
        <div className="filter-row">
          <Input id="report-date" label="Filter Tanggal" placeholder="Pilih tanggal" />
          <Input id="report-employee" label="Pilih Pegawai" placeholder="Semua pegawai" />
          <div className="filter-actions">
            <Button>Cari Data</Button>
            <Button variant="secondary">Reset Filter</Button>
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
