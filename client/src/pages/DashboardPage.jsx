import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  ScanFace,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AlertBanner,
  Button,
  Card,
  MetricCard,
  PageHeader,
  Skeleton,
  StatusBadge,
  Table,
} from '../components/ui'
import { employeeService, reportService } from '../services'

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
  if (status === 'Terlambat' || status === 'Cuti' || status === 'Izin') {
    return 'warning'
  }

  if (status === 'Belum Absen' || status === 'Alfa') {
    return 'danger'
  }

  return 'success'
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

function formatTime(value) {
  if (!value) {
    return '-'
  }

  return value.slice(0, 5)
}

function toAttendanceRow(report) {
  return {
    id: report.id,
    employeeName: report.nama || 'Unknown',
    checkIn: formatTime(report.jamMasuk),
    checkOut: formatTime(report.jamKeluar),
    status: report.status || (report.jamMasuk ? 'Hadir' : 'Belum Absen'),
  }
}

function toActivityItems(reports) {
  return reports
    .flatMap((report) => {
      const employeeName = report.nama || 'Unknown'
      const items = []

      if (report.jamKeluar) {
        items.push({
          id: `${report.id}-out`,
          employeeName,
          label: 'Pulang',
          time: report.jamKeluar,
        })
      }

      if (report.jamMasuk) {
        items.push({
          id: `${report.id}-in`,
          employeeName,
          label: 'Masuk',
          time: report.jamMasuk,
        })
      }

      return items
    })
    .sort((first, second) => second.time.localeCompare(first.time))
}

function getDashboardSummary(reports) {
  return {
    hadir: reports.filter((report) => report.status === 'Hadir').length,
    terlambat: reports.filter((report) => report.status === 'Terlambat').length,
    pulang: reports.filter((report) => report.jamKeluar).length,
    belumAbsen: reports.filter((report) => (
      report.status === 'Belum Absen' || !report.jamMasuk
    )).length,
  }
}

function CompactSection({ children, defaultOpen = false, meta, title }) {
  return (
    <details
      className="group min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-brand-border bg-brand-white shadow-[var(--shadow-soft)]"
      open={defaultOpen}
    >
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_22px] items-center gap-3 bg-brand-white p-4 sm:p-5">
        <span>
          <strong className="mb-1 block text-xl leading-tight text-brand-brown">
            {title}
          </strong>
          {meta ? (
            <small className="block text-[13px] font-bold leading-snug text-brand-brown-muted">
              {meta}
            </small>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="h-5 w-5 text-brand-brown transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="grid gap-3 bg-brand-white px-4 pb-4 sm:px-5 sm:pb-5">
        {children}
      </div>
    </details>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-[1180px] min-w-0 gap-5">
      <PageHeader
        description="Selamat datang, Admin. Pantau kehadiran tim hari ini dengan ringkas."
        icon={LayoutDashboard}
        title="Dashboard"
      />

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        aria-label="Memuat kartu ringkasan..."
      >
        <Skeleton variant="metric" count={1} />
        <Skeleton variant="metric" count={1} />
        <Skeleton variant="metric" count={1} />
        <Skeleton variant="metric" count={1} />
        <Skeleton variant="metric" count={1} />
      </section>

      <Card title="Aksi cepat" description="Memuat aksi cepat...">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton variant="card" className="!h-[68px]" />
          <Skeleton variant="card" className="!h-[68px]" />
          <Skeleton variant="card" className="!h-[68px]" />
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Skeleton variant="card" className="!h-[200px]" />
        <Skeleton variant="card" className="!h-[200px]" />
      </section>
    </div>
  )
}

function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [activeEmployees, setActiveEmployees] = useState([])
  const [todayReports, setTodayReports] = useState([])
  const [dashboardDate, setDashboardDate] = useState(() => getJakartaDateKey())

  const fetchDashboard = useCallback(async ({ showSkeleton = false } = {}) => {
    const today = getJakartaDateKey()

    setDashboardDate(today)
    setError('')

    if (showSkeleton) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const [employeesData, reportsData] = await Promise.all([
        employeeService.getEmployees({ status: 'Aktif' }),
        reportService.getReports({ tanggal: today }),
      ])

      setActiveEmployees(employeesData)
      setTodayReports(reportsData)
    } catch (err) {
      setActiveEmployees([])
      setTodayReports([])
      setError(err.message || 'Gagal memuat data dashboard')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard({ showSkeleton: true })
  }, [fetchDashboard])

  const attendanceRows = useMemo(
    () => todayReports.map(toAttendanceRow),
    [todayReports],
  )
  const latestActivities = useMemo(
    () => toActivityItems(todayReports),
    [todayReports],
  )

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const dashboardSummary = getDashboardSummary(todayReports)
  const attendancePreview = attendanceRows.slice(0, 3)
  const activityPreview = latestActivities.slice(0, 3)
  const metrics = [
    {
      description: 'Pegawai aktif yang tercatat di database.',
      icon: UsersRound,
      label: 'Total Pegawai',
      value: activeEmployees.length,
    },
    {
      description: 'Pegawai masuk dalam batas normal dan toleransi.',
      icon: CheckCircle2,
      label: 'Hadir',
      value: dashboardSummary.hadir,
    },
    {
      description: 'Pegawai masuk setelah batas toleransi.',
      icon: Clock3,
      label: 'Terlambat',
      value: dashboardSummary.terlambat,
    },
    {
      description: 'Pegawai yang sudah melakukan absensi pulang.',
      icon: LogOut,
      label: 'Pulang',
      value: dashboardSummary.pulang,
    },
    {
      description: 'Pegawai aktif yang belum punya absensi hari ini.',
      icon: LogIn,
      label: 'Belum Absen',
      value: dashboardSummary.belumAbsen,
    },
  ]
  const quickActions = [
    { icon: UserPlus, label: 'Tambah Pegawai', to: '/admin/pegawai/tambah' },
    { icon: ScanFace, label: 'Registrasi Wajah', to: '/admin/registrasi-wajah' },
    { icon: FileText, label: 'Lihat Laporan', to: '/admin/laporan' },
  ]

  return (
    <div className="mx-auto grid w-full max-w-[1180px] min-w-0 gap-5">
      <PageHeader
        description="Selamat datang, Admin. Pantau kehadiran tim hari ini dengan ringkas."
        icon={LayoutDashboard}
        title="Dashboard"
      />

      {error ? (
        <AlertBanner
          message={error}
          onDismiss={() => setError('')}
          tone="error"
        />
      ) : null}

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        aria-label="Kartu ringkasan dashboard"
      >
        {metrics.map((metric) => (
          <MetricCard
            description={metric.description}
            icon={metric.icon}
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </section>

      <Card
        actions={
          <Button
            disabled={isRefreshing}
            isLoading={isRefreshing}
            loadingText="Memuat..."
            onClick={() => fetchDashboard()}
            variant="secondary"
          >
            Muat Ulang
          </Button>
        }
        description="Akses tugas yang paling sering dipakai dari satu tempat."
        title="Aksi cepat"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Button
              as={Link}
              className="!min-h-[68px] !w-full !justify-start !bg-brand-page !p-3 !text-left hover:!bg-brand-yellow-soft md:!min-h-[84px] md:!flex-col md:!items-start"
              icon={action.icon}
              key={action.to}
              to={action.to}
              variant="secondary"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <CompactSection
          defaultOpen
          meta={`Menampilkan ${attendancePreview.length} dari ${attendanceRows.length} data pada ${dashboardDate}`}
          title="Data Absensi Hari Ini"
        >
          <Table
            columns={todayColumns}
            data={attendancePreview}
            emptyMessage="Belum ada data absensi hari ini"
            getRowKey={(row) => row.id}
          />
          <p className="rounded-[var(--radius-md)] border border-brand-border bg-brand-page px-3 py-2.5 text-[13px] font-bold text-brand-brown-muted">
            Buka Laporan Kehadiran untuk melihat seluruh data absensi.
          </p>
        </CompactSection>

        <CompactSection
          meta={`${activityPreview.length} aktivitas terbaru`}
          title="Aktivitas Terbaru"
        >
          <ol className="grid gap-2.5 p-0">
            {activityPreview.map((activity, index) => (
              <li
                className="grid min-h-[46px] grid-cols-[34px_minmax(0,1fr)] items-center gap-3 font-bold text-brand-brown"
                key={activity.id}
              >
                <span className="grid h-[34px] w-[34px] place-items-center rounded-[var(--radius-md)] bg-brand-yellow text-[13px] font-extrabold text-brand-brown">
                  {index + 1}
                </span>
                {activity.employeeName} - {activity.label} {formatTime(activity.time)}
              </li>
            ))}
            {activityPreview.length === 0 ? (
              <li className="rounded-[var(--radius-md)] border border-brand-border bg-brand-page px-3 py-2.5 text-[13px] font-bold text-brand-brown-muted">
                Belum ada aktivitas hari ini.
              </li>
            ) : null}
          </ol>
        </CompactSection>
      </section>
    </div>
  )
}

export default DashboardPage
