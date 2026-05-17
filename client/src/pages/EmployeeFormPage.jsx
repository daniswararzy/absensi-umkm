import { useEffect, useState } from 'react'
import { Pencil, Save, UserPlus, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertBanner,
  Button,
  Card,
  Input,
  PageHeader,
  PageLoader,
} from '../components/ui'
import * as employeeService from '../services/employeeService'

const EMPLOYEE_STATUSES = ['Aktif', 'Nonaktif']

const EMPTY_FORM = {
  id: '',
  name: '',
  role: '',
  phone: '',
  address: '',
  status: 'Aktif',
}

function getNextEmployeeId(employees) {
  const nextNumber = employees.reduce((currentMax, employee) => {
    const match = /^PGW-(\d+)$/.exec(employee.id || '')

    if (!match) {
      return currentMax
    }

    return Math.max(currentMax, Number(match[1]))
  }, 0) + 1

  return `PGW-${String(nextNumber).padStart(3, '0')}`
}

function toFormData(employee) {
  return {
    id: employee?.id || '',
    name: employee?.name || '',
    role: employee?.role || '',
    phone: employee?.phone || '',
    address: employee?.address || '',
    status: employee?.status || 'Aktif',
  }
}

function normalizePayload(formData) {
  return {
    id: formData.id.trim(),
    name: formData.name.trim(),
    role: formData.role.trim(),
    phone: formData.phone.trim(),
    address: formData.address.trim(),
    status: formData.status,
  }
}

function validatePayload(payload) {
  const nextErrors = {}

  if (!payload.id) nextErrors.id = 'ID pegawai wajib diisi'
  if (!payload.name) nextErrors.name = 'Nama pegawai wajib diisi'
  if (!payload.role) nextErrors.role = 'Jabatan wajib diisi'
  if (!payload.phone) nextErrors.phone = 'Nomor telepon wajib diisi'
  if (!EMPLOYEE_STATUSES.includes(payload.status)) {
    nextErrors.status = 'Status pegawai harus Aktif atau Nonaktif'
  }

  return nextErrors
}

function EmployeeFormPage() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(employeeId)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadFormData() {
      setIsLoading(true)
      setLoadError('')
      setFeedback(null)
      setErrors({})

      try {
        if (isEdit) {
          const employee = await employeeService.getEmployeeById(employeeId)

          if (isCurrent) {
            setFormData(toFormData(employee))
          }

          return
        }

        const employees = await employeeService.getEmployees()

        if (isCurrent) {
          setFormData({
            ...EMPTY_FORM,
            id: getNextEmployeeId(employees),
          })
        }
      } catch (err) {
        if (!isCurrent) return

        const message = err.message || 'Gagal memuat data pegawai'

        if (isEdit) {
          setLoadError(message)
        } else {
          setFormData(EMPTY_FORM)
          setFeedback({
            tone: 'error',
            message: 'Gagal membuat ID otomatis. Isi ID pegawai secara manual.',
          })
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadFormData()

    return () => {
      isCurrent = false
    }
  }, [employeeId, isEdit, reloadCount])

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))

    if (errors[field]) {
      setErrors((current) => {
        const nextErrors = { ...current }
        delete nextErrors[field]

        return nextErrors
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)

    const payload = normalizePayload(formData)
    const nextErrors = validatePayload(payload)

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      if (isEdit) {
        await employeeService.updateEmployee(employeeId, payload)
      } else {
        await employeeService.createEmployee(payload)
      }

      setFeedback({
        tone: 'success',
        message: isEdit
          ? 'Data pegawai berhasil diperbarui'
          : 'Data pegawai berhasil ditambahkan',
      })
      setTimeout(() => navigate('/admin/pegawai'), 700)
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err.message || 'Gagal menyimpan data pegawai',
      })
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancelClick(event) {
    if (isSaving) {
      event.preventDefault()
    }
  }

  const pageTitle = isEdit ? 'Edit Pegawai' : 'Tambah Pegawai'
  const pageDescription = isEdit
    ? 'Perbarui data pegawai dengan informasi terbaru.'
    : 'Tambahkan pegawai baru agar siap dipakai pada proses absensi.'

  if (isLoading) {
    return <PageLoader message="Memuat data pegawai..." />
  }

  if (loadError) {
    return (
      <>
        <PageHeader
          description={pageDescription}
          icon={isEdit ? Pencil : UserPlus}
          title={pageTitle}
        />
        <Card
          description="Terjadi kesalahan saat mengambil data pegawai dari API."
          title="Gagal memuat data"
        >
          <AlertBanner message={loadError} tone="error" />
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
            <Button onClick={() => setReloadCount((count) => count + 1)}>
              Coba Lagi
            </Button>
            <Button as={Link} to="/admin/pegawai" variant="secondary">
              Kembali
            </Button>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        description={pageDescription}
        icon={isEdit ? Pencil : UserPlus}
        title={pageTitle}
      />

      {feedback ? (
        <AlertBanner
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          tone={feedback.tone}
        />
      ) : null}

      <Card
        description="Lengkapi data dasar pegawai sebelum menyimpan perubahan."
        title={isEdit ? 'Form edit pegawai' : 'Form tambah pegawai'}
      >
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <Input
            disabled={isSaving || isEdit}
            error={errors.id}
            id="employee-id"
            label="ID Pegawai"
            onChange={(event) => updateField('id', event.target.value)}
            value={formData.id}
          />
          <Input
            disabled={isSaving}
            error={errors.name}
            id="employee-name"
            label="Nama Pegawai"
            onChange={(event) => updateField('name', event.target.value)}
            value={formData.name}
          />
          <Input
            disabled={isSaving}
            error={errors.role}
            id="employee-role"
            label="Jabatan"
            onChange={(event) => updateField('role', event.target.value)}
            value={formData.role}
          />
          <Input
            disabled={isSaving}
            error={errors.phone}
            id="employee-phone"
            label="Nomor Telepon"
            onChange={(event) => updateField('phone', event.target.value)}
            value={formData.phone}
          />
          <Input
            disabled={isSaving}
            id="employee-address"
            label="Alamat"
            onChange={(event) => updateField('address', event.target.value)}
            value={formData.address}
          />
          <label className="ui-field" htmlFor="employee-status">
            <span className="ui-field-label">Status Pegawai</span>
            <select
              aria-describedby={errors.status ? 'employee-status-help' : undefined}
              aria-invalid={errors.status ? 'true' : undefined}
              className={`ui-input ${errors.status ? 'error' : ''}`.trim()}
              disabled={isSaving}
              id="employee-status"
              onChange={(event) => updateField('status', event.target.value)}
              value={formData.status}
            >
              {EMPLOYEE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status ? (
              <small className="field-help error" id="employee-status-help">
                {errors.status}
              </small>
            ) : null}
          </label>
          <div className="col-span-full grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
            <Button
              icon={Save}
              isLoading={isSaving}
              loadingText="Menyimpan..."
              type="submit"
            >
              Simpan Data
            </Button>
            <Button
              as={Link}
              disabled={isSaving}
              icon={X}
              onClick={handleCancelClick}
              to="/admin/pegawai"
              variant="secondary"
            >
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}

export default EmployeeFormPage
