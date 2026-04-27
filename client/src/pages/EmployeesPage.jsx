import { Link } from 'react-router-dom'
import { Button, Card, Input, PageHeader, StatusBadge, Table } from '../components/ui'
import { employees } from '../data/dummyData'

const employeeMessages = [
  'Data pegawai berhasil ditambahkan',
  'Data pegawai berhasil diperbarui',
  'Data pegawai berhasil dihapus',
  'Data pegawai tidak ditemukan',
]

const employeeColumns = [
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
      <div className="table-actions">
        <Button as={Link} size="sm" to={`/pegawai/${row.id}/edit`} variant="secondary">
          Edit
        </Button>
        <Button size="sm" variant="ghost">
          Hapus
        </Button>
      </div>
    ),
  },
]

function EmployeesPage() {
  return (
    <>
      <PageHeader
        actions={
          <Button as={Link} to="/pegawai/tambah">
            Tambah Pegawai
          </Button>
        }
        eyebrow="Data Pegawai"
        title="Data Pegawai"
      />

      <Card title="Data Pegawai">
        <div className="filter-row">
          <Input
            id="employee-search"
            label="Cari Pegawai"
            placeholder="Cari nama pegawai..."
          />
        </div>
        <Table
          columns={employeeColumns}
          data={employees}
          emptyMessage="Data pegawai tidak ditemukan"
          getRowKey={(row) => row.id}
        />
      </Card>

      <Card title="Pesan Sistem">
        <ul className="check-list">
          {employeeMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </Card>
    </>
  )
}

export default EmployeesPage
