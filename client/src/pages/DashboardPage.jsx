import { Link } from 'react-router-dom'
import {
  Button,
  Card,
  MetricCard,
  PageHeader,
  StatusBadge,
  Table,
} from '../components/ui'
import { attendanceRecords, employees } from '../data/dummyData'

const todayColumns = [
  { key: 'employeeName', header: 'Nama Pegawai' },
  { key: 'checkIn', header: 'Absensi Masuk' },
  { key: 'checkOut', header: 'Absensi Pulang' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <StatusBadge tone={getAttendanceTone(row.status)}>
        {row.status}
      </StatusBadge>
    ),
  },
]

function getAttendanceTone(status) {
  if (status === 'Terlambat' || status === 'Cuti') {
    return 'warning'
  }

  if (status === 'Belum Absen') {
    return 'danger'
  }

  return 'success'
}

function DashboardPage() {
  const presentToday = attendanceRecords.filter((record) => record.status === 'Hadir')
  const checkInToday = attendanceRecords.filter((record) => record.checkIn !== '-')
  const checkOutToday = attendanceRecords.filter((record) => record.checkOut !== '-')
  const latestActivities = attendanceRecords.slice(0, 4)
  const quickActions = [
    { label: 'Tambah Pegawai', to: '/pegawai/tambah' },
    { label: 'Registrasi Wajah', to: '/registrasi-wajah' },
    { label: 'Lihat Laporan', to: '/laporan' },
  ]

  return (
    <>
      <PageHeader
        description="Selamat Datang, Admin"
        eyebrow="Dashboard"
        title="Dashboard"
      />

      <section className="metric-grid" aria-label="Kartu ringkasan dashboard">
        <MetricCard
          description="Jumlah pegawai yang tercatat di data dummy."
          label="Total Pegawai"
          value={employees.length}
        />
        <MetricCard
          description="Pegawai dengan status hadir pada hari ini."
          label="Kehadiran Hari Ini"
          value={presentToday.length}
        />
        <MetricCard
          description="Pegawai yang sudah melakukan absensi masuk."
          label="Absensi Masuk"
          value={checkInToday.length}
        />
        <MetricCard
          description="Pegawai yang sudah melakukan absensi pulang."
          label="Absensi Pulang"
          value={checkOutToday.length}
        />
      </section>

      <Card title="Tombol cepat">
        <div className="quick-actions">
          {quickActions.map((action) => (
            <Button as={Link} key={action.to} to={action.to} variant="secondary">
              {action.label}
            </Button>
          ))}
        </div>
      </Card>

      <section className="dashboard-grid">
        <Card title="Data Absensi Hari Ini">
          <Table
            columns={todayColumns}
            data={attendanceRecords}
            getRowKey={(row) => row.id}
          />
        </Card>

        <Card title="Aktivitas Terbaru">
          <ol className="flow-list">
            {latestActivities.map((activity) => (
              <li key={activity.id}>
                {activity.employeeName} - {activity.status}
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </>
  )
}

export default DashboardPage
