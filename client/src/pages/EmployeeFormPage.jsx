import { useEffect, useState } from 'react'
import { Pencil, Save, UserPlus, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertBanner, Button, Card, Input, PageHeader, PageLoader } from '../components/ui'
import * as employeeService from '../services/employeeService'

function EmployeeFormPage() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(employeeId)

  const [isLoading, setIsLoading] = useState(isEdit)
  const [formData, setFormData] = useState({
    id: 'PGW-006', name: '', role: '', phone: '', address: '', status: 'Aktif',
  })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (!isEdit) return

    async function loadEmployee() {
      try {
        const emp = await employeeService.getEmployeeById(employeeId)
        if (emp) {
          setFormData({ id: emp.id, name: emp.name, role: emp.role, phone: emp.phone, address: emp.address || '', status: emp.status })
        } else {
          setFeedback({ tone: 'error', message: 'Data pegawai tidak ditemukan' })
        }
      } catch (err) {
        setFeedback({ tone: 'error', message: err.message || 'Gagal memuat data pegawai' })
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployee()
  }, [employeeId, isEdit])

  function updateField(field, value) {
    setFormData((c) => ({ ...c, [field]: value }))
    if (errors[field]) {
      setErrors((c) => { const n = { ...c }; delete n[field]; return n })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)

    const nextErrors = {}
    if (!formData.name) nextErrors.name = 'Nama pegawai wajib diisi'
    if (!formData.role) nextErrors.role = 'Jabatan wajib diisi'
    if (!formData.phone) nextErrors.phone = 'Nomor telepon wajib diisi'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      if (isEdit) {
        await employeeService.updateEmployee(employeeId, formData)
      } else {
        await employeeService.createEmployee(formData)
      }
      setFeedback({ tone: 'success', message: isEdit ? 'Data pegawai berhasil diperbarui' : 'Data pegawai berhasil ditambahkan' })
      setTimeout(() => navigate('/pegawai'), 800)
    } catch (err) {
      setFeedback({ tone: 'error', message: err.message || 'Gagal menyimpan data pegawai' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <PageLoader message="Memuat data pegawai..." />
  }

  return (
    <>
      <PageHeader
        description={isEdit ? 'Perbarui data pegawai dengan informasi terbaru.' : 'Tambahkan pegawai baru agar siap dipakai pada proses absensi.'}
        icon={isEdit ? Pencil : UserPlus}
        title={isEdit ? 'Edit Pegawai' : 'Tambah Pegawai'}
      />

      {feedback ? (
        <AlertBanner message={feedback.message} onDismiss={() => setFeedback(null)} tone={feedback.tone} />
      ) : null}

      <Card
        description="Lengkapi data dasar pegawai sebelum menyimpan perubahan."
        title={isEdit ? 'Form edit pegawai' : 'Form tambah pegawai'}
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Input disabled={isSaving} id="employee-id" label="ID Pegawai" onChange={(e) => updateField('id', e.target.value)} value={formData.id} />
          <Input disabled={isSaving} error={errors.name} id="employee-name" label="Nama Pegawai" onChange={(e) => updateField('name', e.target.value)} value={formData.name} />
          <Input disabled={isSaving} error={errors.role} id="employee-role" label="Jabatan" onChange={(e) => updateField('role', e.target.value)} value={formData.role} />
          <Input disabled={isSaving} error={errors.phone} id="employee-phone" label="Nomor Telepon" onChange={(e) => updateField('phone', e.target.value)} value={formData.phone} />
          <Input disabled={isSaving} id="employee-address" label="Alamat" onChange={(e) => updateField('address', e.target.value)} value={formData.address} />
          <Input disabled={isSaving} id="employee-status" label="Status Pegawai" onChange={(e) => updateField('status', e.target.value)} value={formData.status} />
          <div className="col-span-full grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
            <Button icon={Save} isLoading={isSaving} loadingText="Menyimpan..." type="submit">Simpan Data</Button>
            <Button as={Link} disabled={isSaving} icon={X} to="/pegawai" variant="secondary">Batal</Button>
          </div>
        </form>
      </Card>
    </>
  )
}

export default EmployeeFormPage
