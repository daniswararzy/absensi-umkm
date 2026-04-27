import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, StatusBadge } from '../components/ui'
import { attendanceRecords, employees } from '../data/dummyData'

const employee = employees[0]
const attendance = attendanceRecords.find(
  (record) => record.employeeId === employee.id,
)

function formatDate(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(date) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function EmployeeDashboardPage() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <main className="employee-dashboard-page">
      <section className="employee-dashboard-header">
        <div>
          <p className="eyebrow">Dashboard Pegawai</p>
          <h1>Dashboard Pegawai</h1>
          <p>Selamat datang di sistem absensi pegawai</p>
        </div>
        <div className="employee-clock" aria-label="Tanggal dan waktu saat ini">
          <span>{formatDate(now)}</span>
          <strong>{formatTime(now)}</strong>
        </div>
      </section>

      <section className="employee-dashboard-grid">
        <Card title="Identitas Pegawai">
          <div className="employee-info-list">
            <div>
              <span>Nama Pegawai</span>
              <strong>{employee.name}</strong>
            </div>
            <div>
              <span>ID Pegawai</span>
              <strong>{employee.id}</strong>
            </div>
            <div>
              <span>Jabatan</span>
              <strong>{employee.role}</strong>
            </div>
          </div>
        </Card>

        <Card title="Status Kehadiran Hari Ini">
          <div className="employee-attendance-card">
            <div className="attendance-status-row">
              <span>Status Kehadiran Hari Ini</span>
              <StatusBadge>{attendance?.status || 'Belum Absen'}</StatusBadge>
            </div>
            <div>
              <span>Jam Masuk</span>
              <strong>{attendance?.checkIn || '-'}</strong>
            </div>
            <div>
              <span>Jam Pulang</span>
              <strong>{attendance?.checkOut || '-'}</strong>
            </div>
          </div>
        </Card>
      </section>

      <section className="employee-action-card">
        <div>
          <h2>Absensi Hari Ini</h2>
          <p>
            Gunakan tombol di bawah untuk melakukan absensi masuk atau pulang
            dengan pemindaian wajah.
          </p>
        </div>
        <div className="employee-action-buttons">
          <Button as={Link} to="/absensi">
            Lakukan Absensi
          </Button>
          <Button variant="secondary">Lihat Riwayat Absensi</Button>
        </div>
      </section>
    </main>
  )
}

export default EmployeeDashboardPage
