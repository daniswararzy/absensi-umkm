import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  History,
  IdCard,
  ScanFace,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, PageLoader, Skeleton, StatusBadge } from '../components/ui'
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

function EmployeeDashboardSkeleton() {
  return (
    <main className="mx-auto grid min-h-[100svh] w-full max-w-[480px] content-start gap-4 bg-brand-page p-4 sm:max-w-[760px] sm:p-6 md:max-w-[1120px] md:gap-6 md:p-[32px_var(--page-gutter-desktop)]">
      {/* Header skeleton */}
      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-brand-border bg-brand-white p-4 shadow-[var(--shadow-soft)] md:flex md:items-start md:justify-between md:gap-6 md:p-7">
        <div className="grid grid-cols-[46px_minmax(0,1fr)] items-start gap-3">
          <Skeleton variant="circle" className="!w-[46px] !h-[46px]" />
          <div className="grid gap-2">
            <Skeleton variant="heading" className="!w-[200px]" />
            <Skeleton variant="text" className="!w-[280px]" />
          </div>
        </div>
        <Skeleton variant="card" className="!h-[80px] !w-full md:!w-[260px]" />
      </section>

      {/* Cards skeleton */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
        <Skeleton variant="card" className="!h-[320px]" />
        <Skeleton variant="card" className="!h-[320px]" />
      </section>

      {/* Action skeleton */}
      <Skeleton variant="card" className="!h-[120px]" />
    </main>
  )
}

function EmployeeDashboardPage() {
  const [now, setNow] = useState(() => new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    // Simulate initial data load
    const timer = setTimeout(() => setIsLoading(false), 700)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <EmployeeDashboardSkeleton />
  }

  return (
    <main className="mx-auto grid min-h-[100svh] w-full max-w-[480px] content-start gap-4 bg-brand-page p-4 sm:max-w-[760px] sm:p-6 md:max-w-[1120px] md:gap-6 md:p-[32px_var(--page-gutter-desktop)]">
      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-brand-border bg-brand-white p-4 shadow-[var(--shadow-soft)] md:flex md:items-start md:justify-between md:gap-6 md:p-7">
        <div className="grid grid-cols-[46px_minmax(0,1fr)] items-start gap-3">
          <span className="grid h-[46px] w-[46px] place-items-center rounded-[var(--radius-md)] bg-brand-yellow text-brand-brown shadow-[var(--shadow-subtle)]">
            <UserRound aria-hidden="true" className="h-[23px] w-[23px] stroke-[2.4]" />
          </span>
          <div>
            <h1 className="mb-1.5 text-[28px] leading-tight text-brand-brown sm:text-[34px]">
              Dashboard Pegawai
            </h1>
            <p className="mb-0 text-brand-brown-muted">
              Selamat datang di sistem absensi pegawai
            </p>
          </div>
        </div>
        <div
          className="grid min-w-0 gap-2 rounded-[var(--radius-md)] border border-brand-border-strong bg-brand-yellow-soft p-3.5 text-left md:min-w-[260px] md:text-right"
          aria-label="Tanggal dan waktu saat ini"
        >
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays aria-hidden="true" className="h-[17px] w-[17px] flex-none stroke-[2.4] text-brand-brown" />
            <span className="min-w-0 text-sm font-bold text-brand-brown-muted">
              {formatDate(now)}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Clock3 aria-hidden="true" className="h-[17px] w-[17px] flex-none stroke-[2.4] text-brand-brown" />
            <strong className="min-w-0 text-2xl leading-none text-brand-brown">
              {formatTime(now)}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
        <Card title="Identitas Pegawai">
          <div className="grid gap-3">
            <div className="grid min-h-[76px] grid-cols-[36px_minmax(0,1fr)] content-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <UserRound aria-hidden="true" className="row-span-2 h-5 w-5 self-center stroke-[2.4] text-brand-brown" />
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Nama Pegawai</span>
              <strong className="text-[17px] text-brand-brown">{employee.name}</strong>
            </div>
            <div className="grid min-h-[76px] grid-cols-[36px_minmax(0,1fr)] content-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <IdCard aria-hidden="true" className="row-span-2 h-5 w-5 self-center stroke-[2.4] text-brand-brown" />
              <span className="text-[13px] font-extrabold text-brand-brown-muted">ID Pegawai</span>
              <strong className="text-[17px] text-brand-brown">{employee.id}</strong>
            </div>
            <div className="grid min-h-[76px] grid-cols-[36px_minmax(0,1fr)] content-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <BriefcaseBusiness aria-hidden="true" className="row-span-2 h-5 w-5 self-center stroke-[2.4] text-brand-brown" />
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Jabatan</span>
              <strong className="text-[17px] text-brand-brown">{employee.role}</strong>
            </div>
          </div>
        </Card>

        <Card title="Status Kehadiran Hari Ini">
          <div className="grid gap-3">
            <div className="grid min-h-[76px] grid-cols-[36px_minmax(0,1fr)] content-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <BadgeCheck aria-hidden="true" className="row-span-2 h-5 w-5 self-center stroke-[2.4] text-brand-brown" />
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Status Kehadiran Hari Ini</span>
              <StatusBadge>{attendance?.status || 'Belum Absen'}</StatusBadge>
            </div>
            <div className="grid min-h-[76px] grid-cols-[36px_minmax(0,1fr)] content-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <Clock3 aria-hidden="true" className="row-span-2 h-5 w-5 self-center stroke-[2.4] text-brand-brown" />
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Jam Masuk</span>
              <strong className="text-[17px] text-brand-brown">{attendance?.checkIn || '-'}</strong>
            </div>
            <div className="grid min-h-[76px] grid-cols-[36px_minmax(0,1fr)] content-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <Clock3 aria-hidden="true" className="row-span-2 h-5 w-5 self-center stroke-[2.4] text-brand-brown" />
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Jam Pulang</span>
              <strong className="text-[17px] text-brand-brown">{attendance?.checkOut || '-'}</strong>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-brand-border-strong bg-brand-white p-4 shadow-[var(--shadow-soft)] md:flex md:items-center md:justify-between md:gap-5 md:p-6">
        <div>
          <h2 className="mb-2 text-[22px] text-brand-brown md:text-2xl">Absensi Hari Ini</h2>
          <p className="mb-0 max-w-[680px] text-brand-brown-muted">
            Gunakan tombol di bawah untuk melakukan absensi masuk atau pulang
            dengan pemindaian wajah.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:flex md:flex-wrap md:justify-end">
          <Button as={Link} icon={ScanFace} to="/absensi">
            Lakukan Absensi
          </Button>
          <Button icon={History} variant="secondary">
            Lihat Riwayat Absensi
          </Button>
        </div>
      </section>
    </main>
  )
}

export default EmployeeDashboardPage
