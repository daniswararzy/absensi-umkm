import { useEffect, useState } from 'react'
import { Camera, RefreshCcw, Save, ScanFace } from 'lucide-react'
import FaceCapturePlaceholder from '../components/face/FaceCapturePlaceholder'
import { Button, Card, PageHeader, Skeleton, StatusBadge, Table } from '../components/ui'
import { employees } from '../data/dummyData'

const selectedEmployee = employees[0]

const faceRows = employees.map((employee) => ({
  id: employee.id,
  name: employee.name,
  role: employee.role,
  status: employee.faceStatus,
}))

const faceColumns = [
  { key: 'name', header: 'Nama Pegawai' },
  { key: 'role', header: 'Jabatan' },
  { key: 'id', header: 'ID Pegawai' },
  {
    key: 'status',
    header: 'Status Sistem',
    render: (row) => (
      <StatusBadge tone={row.status === 'Terdaftar' ? 'success' : 'warning'}>
        {row.status}
      </StatusBadge>
    ),
  },
]

const systemStatuses = [
  'Kamera aktif',
  'Wajah berhasil terdeteksi',
  'Wajah tidak terdeteksi',
  'Silakan hadapkan wajah ke kamera',
  'Data wajah berhasil disimpan',
  'Gagal menyimpan data wajah',
]

function FaceRegistrationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Simulate initial page data load
    const timer = setTimeout(() => setIsLoading(false), 800)

    return () => clearTimeout(timer)
  }, [])

  function handleSave() {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1200)
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          description="Lakukan perekaman wajah pegawai untuk proses absensi"
          icon={ScanFace}
          title="Registrasi Wajah"
        />
        <section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(280px,0.7fr)_minmax(0,1fr)]">
          <Skeleton variant="card" className="!h-[380px]" />
          <Skeleton variant="card" className="!h-[380px]" />
        </section>
        <section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <Skeleton variant="card" className="!h-[260px]" />
          <Skeleton variant="card" className="!h-[260px]" />
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader
        description="Lakukan perekaman wajah pegawai untuk proses absensi"
        icon={ScanFace}
        title="Registrasi Wajah"
      />

      <section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(280px,0.7fr)_minmax(0,1fr)]">
        <FaceCapturePlaceholder />
        <Card
          actions={
            <>
              <Button icon={Camera}>Mulai Kamera</Button>
              <Button icon={ScanFace} variant="secondary">
                Ambil Wajah
              </Button>
              <Button
                icon={Save}
                isLoading={isSaving}
                loadingText="Menyimpan..."
                onClick={handleSave}
                variant="secondary"
              >
                Simpan Data Wajah
              </Button>
              <Button icon={RefreshCcw} variant="ghost">
                Ulangi
              </Button>
            </>
          }
          description="Pastikan identitas pegawai sesuai sebelum menyimpan data wajah."
          title="Informasi Pegawai"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Nama Pegawai</span>
              <strong className="text-base text-brand-brown">{selectedEmployee.name}</strong>
            </div>
            <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Jabatan</span>
              <strong className="text-base text-brand-brown">{selectedEmployee.role}</strong>
            </div>
            <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <span className="text-[13px] font-extrabold text-brand-brown-muted">ID Pegawai</span>
              <strong className="text-base text-brand-brown">{selectedEmployee.id}</strong>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Card
          description="Checklist simulasi proses kamera dan penyimpanan wajah."
          title="Status Sistem"
        >
          <ul className="grid gap-3 p-0">
            {systemStatuses.map((status) => (
              <li
                className="rounded-[var(--radius-md)] border border-brand-border bg-brand-page px-3.5 py-3 font-bold leading-normal text-brand-brown"
                key={status}
              >
                {status}
              </li>
            ))}
          </ul>
        </Card>
        <Card
          description="Pantau pegawai yang sudah dan belum memiliki data wajah."
          title="Data Registrasi Wajah"
        >
          <Table columns={faceColumns} data={faceRows} getRowKey={(row) => row.id} />
        </Card>
      </section>
    </>
  )
}

export default FaceRegistrationPage
