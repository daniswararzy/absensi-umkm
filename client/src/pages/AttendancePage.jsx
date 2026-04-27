import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, StatusBadge } from '../components/ui'
import { employees } from '../data/dummyData'

const employee = employees[0]
const scanStatuses = [
  'Menunggu pemindaian wajah',
  'Memproses data wajah...',
  'Wajah berhasil terdeteksi',
  'Wajah tidak dikenali',
  'Pegawai tidak terdaftar',
]

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

function AttendancePage() {
  const [attendanceType, setAttendanceType] = useState('Absensi Masuk')
  const [scanStatus, setScanStatus] = useState(scanStatuses[0])
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  function handleStartScan() {
    setScanStatus('Memproses data wajah...')
  }

  function handleResetScan() {
    setScanStatus('Menunggu pemindaian wajah')
  }

  return (
    <main className="employee-attendance-page">
      <section className="employee-dashboard-header">
        <div>
          <p className="eyebrow">Absensi Pegawai</p>
          <h1>Absensi Pegawai</h1>
          <p>Silakan pilih jenis absensi dan lakukan pemindaian wajah</p>
        </div>
        <div className="employee-clock" aria-label="Tanggal dan waktu saat ini">
          <span>{formatDate(now)}</span>
          <strong>{formatTime(now)}</strong>
        </div>
      </section>

      <section className="attendance-type-card">
        <div>
          <h2>Jenis Absensi</h2>
          <p>Pilih salah satu jenis absensi sebelum memulai scan wajah.</p>
        </div>
        <div className="attendance-type-selector" role="group" aria-label="Jenis absensi">
          {['Absensi Masuk', 'Absensi Pulang'].map((type) => (
            <button
              className={attendanceType === type ? 'selected' : ''}
              key={type}
              onClick={() => setAttendanceType(type)}
              type="button"
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="employee-attendance-grid">
        <Card title="Area Scan Wajah">
          <div className="scan-area">
            <div className="scan-frame" aria-label="Area Scan Wajah">
              <div className="scan-target" aria-hidden="true"></div>
            </div>
            <div className="scan-actions">
              <Button>Mulai Kamera</Button>
              <Button onClick={handleStartScan} variant="secondary">
                Mulai Scan
              </Button>
              <Button onClick={handleResetScan} variant="ghost">
                Ulangi Scan
              </Button>
              <Button as={Link} to="/dashboard-pegawai" variant="secondary">
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        </Card>

        <div className="attendance-side-stack">
          <Card title="Status Pemindaian">
            <div className="scan-status-current">
              <span>Status Deteksi</span>
              <StatusBadge tone="info">{scanStatus}</StatusBadge>
            </div>
            <ul className="scan-status-list">
              {scanStatuses.map((status) => (
                <li className={scanStatus === status ? 'active' : ''} key={status}>
                  {status}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Hasil Verifikasi">
            <div className="info-grid single-column">
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
              <div>
                <span>Status Absensi</span>
                <StatusBadge>{attendanceType}</StatusBadge>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="notification-grid" aria-label="Area notifikasi absensi">
        <div className="notification-box success">
          <strong>Berhasil</strong>
          <p>Wajah berhasil terdeteksi. Data absensi siap disimpan.</p>
        </div>
        <div className="notification-box error">
          <strong>Gagal</strong>
          <p>Wajah tidak dikenali atau pegawai tidak terdaftar.</p>
        </div>
      </section>
    </main>
  )
}

export default AttendancePage
