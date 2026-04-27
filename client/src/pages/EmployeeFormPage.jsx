import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, Input, PageHeader } from '../components/ui'
import { getEmployeeById } from '../data/dummyData'

function EmployeeFormPage() {
  const { employeeId } = useParams()
  const employee = employeeId ? getEmployeeById(employeeId) : null
  const isEdit = Boolean(employeeId)
  const [formData, setFormData] = useState({
    id: employee?.id || 'PGW-006',
    name: employee?.name || '',
    role: employee?.role || '',
    phone: employee?.phone || '',
    address: employee?.address || '',
    status: employee?.status || 'Aktif',
  })
  const [errors, setErrors] = useState({})

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!formData.name) {
      nextErrors.name = 'Nama pegawai wajib diisi'
    }

    if (!formData.role) {
      nextErrors.role = 'Jabatan wajib diisi'
    }

    if (!formData.phone) {
      nextErrors.phone = 'Nomor telepon wajib diisi'
    }

    setErrors(nextErrors)
  }

  return (
    <>
      <PageHeader
        eyebrow={isEdit ? 'Edit Pegawai' : 'Tambah Pegawai'}
        title={isEdit ? 'Edit Pegawai' : 'Tambah Pegawai'}
      />

      <Card title={isEdit ? 'Edit Pegawai' : 'Tambah Pegawai'}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <Input
            id="employee-id"
            label="ID Pegawai"
            onChange={(event) => updateField('id', event.target.value)}
            value={formData.id}
          />
          <Input
            error={errors.name}
            id="employee-name"
            label="Nama Pegawai"
            onChange={(event) => updateField('name', event.target.value)}
            value={formData.name}
          />
          <Input
            error={errors.role}
            id="employee-role"
            label="Jabatan"
            onChange={(event) => updateField('role', event.target.value)}
            value={formData.role}
          />
          <Input
            error={errors.phone}
            id="employee-phone"
            label="Nomor Telepon"
            onChange={(event) => updateField('phone', event.target.value)}
            value={formData.phone}
          />
          <Input
            id="employee-address"
            label="Alamat"
            onChange={(event) => updateField('address', event.target.value)}
            value={formData.address}
          />
          <Input
            id="employee-status"
            label="Status Pegawai"
            onChange={(event) => updateField('status', event.target.value)}
            value={formData.status}
          />
          <div className="form-actions">
            <Button type="submit">Simpan Data</Button>
            <Button as={Link} to="/pegawai" variant="secondary">
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}

export default EmployeeFormPage
