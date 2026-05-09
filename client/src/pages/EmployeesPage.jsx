import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2, UserPlus, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AlertBanner,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  Skeleton,
  StatusBadge,
  Table,
} from '../components/ui'
import * as employeeService from '../services/employeeService'

const employeeColumns = (onDeleteClick) => [
  { key: 'id', header: 'ID Pegawai' },
  { key: 'name', header: 'Nama Pegawai' },
  { key: 'role', header: 'Jabatan' },
  { key: 'phone', header: 'Nomor Telepon' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <StatusBadge tone={row.status === 'Aktif' ? 'success' : 'warning'}>
        {row.status}
      </StatusBadge>
    ),
  },
  {
    key: 'action',
    header: 'Aksi',
    render: (row) => (
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button
          as={Link}
          icon={Pencil}
          size="sm"
          to={`/pegawai/${row.id}/edit`}
          variant="secondary"
        >
          Edit
        </Button>
        <Button
          icon={Trash2}
          onClick={() => onDeleteClick(row)}
          size="sm"
          variant="ghost"
        >
          Hapus
        </Button>
      </div>
    ),
  },
]

function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch employees via service
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await employeeService.getEmployees()

      setEmployees(data)
    } catch (err) {
      setError(err.message || 'Gagal memuat data pegawai')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // Delete flow
  function handleDeleteClick(employee) {
    setDeleteTarget(employee)
  }

  function handleDeleteCancel() {
    setDeleteTarget(null)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return

    setIsDeleting(true)
    setFeedback(null)

    try {
      await employeeService.deleteEmployee(deleteTarget.id)

      setFeedback({
        tone: 'success',
        message: `Data pegawai "${deleteTarget.name}" berhasil dihapus`,
      })
      setDeleteTarget(null)
      // Refetch to reflect changes (mock won't actually remove, but flow is correct)
      await fetchEmployees()
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err.message || 'Gagal menghapus data pegawai',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <PageHeader
          actions={
            <Skeleton variant="card" className="!h-[46px] !w-[180px]" />
          }
          description="Kelola identitas, status, dan data kontak pegawai UMKM."
          icon={UsersRound}
          title="Data Pegawai"
        />
        <Card title="Daftar pegawai" description="Memuat data pegawai...">
          <Skeleton variant="text" count={1} />
          <div className="mt-4">
            <Skeleton variant="table-row" count={4} />
          </div>
        </Card>
      </>
    )
  }

  // Error state — full page
  if (error && employees.length === 0) {
    return (
      <>
        <PageHeader
          description="Kelola identitas, status, dan data kontak pegawai UMKM."
          icon={UsersRound}
          title="Data Pegawai"
        />
        <Card title="Gagal memuat data" description="Terjadi kesalahan saat mengambil data pegawai.">
          <AlertBanner
            message={error}
            tone="error"
            onDismiss={() => setError('')}
          />
          <div className="mt-4">
            <Button onClick={fetchEmployees} variant="secondary">
              Coba Lagi
            </Button>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        actions={
          <Button as={Link} icon={UserPlus} to="/pegawai/tambah">
            Tambah Pegawai
          </Button>
        }
        description="Kelola identitas, status, dan data kontak pegawai UMKM."
        icon={UsersRound}
        title="Data Pegawai"
      />

      {/* Feedback banner */}
      {feedback ? (
        <AlertBanner
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          tone={feedback.tone}
        />
      ) : null}

      <Card
        description="Gunakan pencarian untuk menemukan pegawai dengan cepat."
        title="Daftar pegawai"
      >
        <div className="mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Input
            id="employee-search"
            label="Cari Pegawai"
            placeholder="Cari nama pegawai..."
          />
        </div>
        <Table
          columns={employeeColumns(handleDeleteClick)}
          data={employees}
          emptyMessage="Data pegawai tidak ditemukan"
          getRowKey={(row) => row.id}
        />
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={handleDeleteCancel}
        title="Hapus Pegawai"
        footer={
          <>
            <Button
              isLoading={isDeleting}
              loadingText="Menghapus..."
              onClick={handleDeleteConfirm}
              variant="primary"
            >
              Ya, Hapus
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleDeleteCancel}
              variant="secondary"
            >
              Batal
            </Button>
          </>
        }
      >
        <p>
          Apakah Anda yakin ingin menghapus data pegawai{' '}
          <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat
          dibatalkan.
        </p>
      </Modal>
    </>
  )
}

export default EmployeesPage
