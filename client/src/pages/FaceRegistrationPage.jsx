import FaceCapturePlaceholder from '../components/face/FaceCapturePlaceholder'
import { Button, Card, PageHeader, StatusBadge, Table } from '../components/ui'
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
  return (
    <>
      <PageHeader
        description="Lakukan perekaman wajah pegawai untuk proses absensi"
        eyebrow="Registrasi Wajah"
        title="Registrasi Wajah"
      />

      <section className="attendance-layout">
        <FaceCapturePlaceholder />
        <Card
          actions={
            <>
              <Button>Mulai Kamera</Button>
              <Button variant="secondary">Ambil Wajah</Button>
              <Button variant="secondary">Simpan Data Wajah</Button>
              <Button variant="ghost">Ulangi</Button>
            </>
          }
          title="Informasi Pegawai"
        >
          <div className="info-grid">
            <div>
              <span>Nama Pegawai</span>
              <strong>{selectedEmployee.name}</strong>
            </div>
            <div>
              <span>Jabatan</span>
              <strong>{selectedEmployee.role}</strong>
            </div>
            <div>
              <span>ID Pegawai</span>
              <strong>{selectedEmployee.id}</strong>
            </div>
          </div>
        </Card>
      </section>

      <section className="dashboard-grid">
        <Card title="Status Sistem">
          <ul className="check-list">
            {systemStatuses.map((status) => (
              <li key={status}>{status}</li>
            ))}
          </ul>
        </Card>
        <Card title="Data Registrasi Wajah">
          <Table columns={faceColumns} data={faceRows} getRowKey={(row) => row.id} />
        </Card>
      </section>
    </>
  )
}

export default FaceRegistrationPage
