import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import { Camera, RefreshCcw, Save, ScanFace } from 'lucide-react'
import {
  AlertBanner,
  Button,
  Card,
  PageHeader,
  Skeleton,
  StatusBadge,
  Table,
} from '../components/ui'
import * as faceService from '../services/faceService'

const MODEL_URL = '/models'
const DESCRIPTOR_LENGTH = 128

const faceColumns = [
  { key: 'name', header: 'Nama Pegawai' },
  { key: 'role', header: 'Jabatan' },
  { key: 'id', header: 'ID Pegawai' },
  {
    key: 'faceStatus',
    header: 'Status Sistem',
    render: (row) => (
      <StatusBadge tone={row.faceStatus === 'Terdaftar' ? 'success' : 'warning'}>
        {row.faceStatus}
      </StatusBadge>
    ),
  },
]

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

function getStatusTone(status) {
  if (status === 'Siap' || status === 'Aktif' || status === 'Terdeteksi') {
    return 'success'
  }

  if (status === 'Gagal' || status === 'Belum') {
    return 'danger'
  }

  return 'info'
}

function normalizeDescriptor(value) {
  const descriptorValues = Array.from(value || [])

  if (descriptorValues.length !== DESCRIPTOR_LENGTH) {
    throw new Error('Descriptor wajah tidak valid. Silakan ambil ulang wajah.')
  }

  const normalized = descriptorValues.map((item) => Number(item))

  if (normalized.some((item) => !Number.isFinite(item))) {
    throw new Error('Descriptor wajah berisi nilai tidak valid. Silakan ambil ulang wajah.')
  }

  return normalized
}

function FaceRegistrationPage() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [modelError, setModelError] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [descriptor, setDescriptor] = useState(null)
  const [detectionScore, setDetectionScore] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  )

  const loadEmployees = useCallback(async () => {
    try {
      const data = await faceService.getFaceRegistrationStatus()

      setEmployees(data)
      setSelectedEmployeeId((current) => current || data[0]?.id || '')
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err.message || 'Gagal memuat data registrasi wajah',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    async function loadModels() {
      setIsModelLoading(true)
      setModelError('')

      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
      } catch (err) {
        if (isCurrent) {
          setModelError(err.message || 'Gagal memuat model face-api.js')
        }
      } finally {
        if (isCurrent) {
          setIsModelLoading(false)
        }
      }
    }

    loadModels()
    loadEmployees()

    return () => {
      isCurrent = false
      stopStream(streamRef.current)
    }
  }, [loadEmployees])

  async function handleStartCamera() {
    setFeedback(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setFeedback({
        tone: 'error',
        message: 'Browser tidak mendukung akses kamera',
      })
      return
    }

    try {
      stopStream(streamRef.current)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsCameraActive(true)
      setDescriptor(null)
      setDetectionScore(null)
      setFeedback({
        tone: 'success',
        message: 'Kamera aktif',
      })
    } catch (err) {
      setIsCameraActive(false)
      setFeedback({
        tone: 'error',
        message: err.message || 'Gagal mengaktifkan kamera',
      })
    }
  }

  async function handleCaptureFace() {
    setFeedback(null)

    if (isModelLoading || modelError) {
      setFeedback({
        tone: 'error',
        message: modelError || 'Model face-api.js masih dimuat',
      })
      return
    }

    if (!videoRef.current || !isCameraActive) {
      setFeedback({
        tone: 'error',
        message: 'Aktifkan kamera sebelum mengambil wajah',
      })
      return
    }

    setIsCapturing(true)

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5,
          }),
        )
        .withFaceLandmarks(true)
        .withFaceDescriptor()

      if (!detection) {
        setDescriptor(null)
        setDetectionScore(null)
        setFeedback({
          tone: 'error',
          message: 'Wajah tidak terdeteksi. Hadapkan wajah ke kamera lalu coba lagi.',
        })
        return
      }

      const capturedDescriptor = normalizeDescriptor(detection.descriptor)

      setDescriptor(capturedDescriptor)
      setDetectionScore(detection.detection.score)
      setFeedback({
        tone: 'success',
        message: 'Descriptor wajah berhasil diambil',
      })
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err.message || 'Gagal mengambil descriptor wajah',
      })
    } finally {
      setIsCapturing(false)
    }
  }

  async function handleSave() {
    setFeedback(null)

    if (!selectedEmployeeId) {
      setFeedback({ tone: 'error', message: 'Pilih pegawai terlebih dahulu' })
      return
    }

    if (!descriptor) {
      setFeedback({ tone: 'error', message: 'Ambil wajah terlebih dahulu' })
      return
    }

    if (!selectedEmployee) {
      setFeedback({ tone: 'error', message: 'Pegawai terpilih tidak valid' })
      return
    }

    setIsSaving(true)

    try {
      const validDescriptor = normalizeDescriptor(descriptor)
      const result = await faceService.saveFaceData({
        employeeId: selectedEmployeeId,
        descriptor: validDescriptor,
      })

      setEmployees((current) =>
        current.map((employee) =>
          employee.id === result.employee.id
            ? { ...employee, ...result.employee }
            : employee,
        ),
      )
      setFeedback({
        tone: 'success',
        message: result.message || 'Data wajah berhasil disimpan',
      })
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err.message || 'Gagal menyimpan data wajah',
      })
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset() {
    setDescriptor(null)
    setDetectionScore(null)
    setFeedback(null)
  }

  function handleEmployeeChange(event) {
    setSelectedEmployeeId(event.target.value)
    setDescriptor(null)
    setDetectionScore(null)
    setFeedback(null)
  }

  const systemStatuses = [
    {
      label: 'Model face-api.js',
      status: modelError ? 'Gagal' : isModelLoading ? 'Memuat' : 'Siap',
    },
    {
      label: 'Kamera',
      status: isCameraActive ? 'Aktif' : 'Belum',
    },
    {
      label: 'Descriptor wajah',
      status: descriptor ? 'Terdeteksi' : 'Belum',
    },
    {
      label: 'Pegawai terpilih',
      status: selectedEmployee ? selectedEmployee.name : 'Belum',
    },
  ]

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

      {feedback ? (
        <AlertBanner
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          tone={feedback.tone}
        />
      ) : null}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(280px,0.7fr)_minmax(0,1fr)]">
        <Card title="Area Kamera">
          <div className="grid gap-4">
            <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[#f1d37a] bg-brand-yellow-soft">
              <video
                aria-label="Pratinjau kamera registrasi wajah"
                autoPlay
                className="h-full w-full object-cover"
                muted
                playsInline
                ref={videoRef}
              />
              {!isCameraActive ? (
                <div className="absolute inset-0 grid place-items-center bg-brand-yellow-soft p-4 text-center">
                  <div className="grid justify-items-center gap-2">
                    <ScanFace
                      aria-hidden="true"
                      className="h-14 w-14 stroke-[1.8] text-brand-brown"
                    />
                    <strong className="text-brand-brown">Kamera belum aktif</strong>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
              <Button
                disabled={isSaving}
                icon={Camera}
                onClick={handleStartCamera}
              >
                Mulai Kamera
              </Button>
              <Button
                disabled={isSaving || isModelLoading}
                icon={ScanFace}
                isLoading={isCapturing}
                loadingText="Mengambil..."
                onClick={handleCaptureFace}
                variant="secondary"
              >
                Ambil Wajah
              </Button>
              <Button
                disabled={!descriptor}
                icon={Save}
                isLoading={isSaving}
                loadingText="Menyimpan..."
                onClick={handleSave}
                variant="secondary"
              >
                Simpan Data Wajah
              </Button>
              <Button
                disabled={isCapturing || isSaving}
                icon={RefreshCcw}
                onClick={handleReset}
                variant="ghost"
              >
                Ulangi
              </Button>
            </div>
          </div>
        </Card>

        <Card
          description="Pastikan identitas pegawai sesuai sebelum menyimpan data wajah."
          title="Informasi Pegawai"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <label className="ui-field md:col-span-3" htmlFor="face-employee">
              <span className="ui-field-label">Pilih Pegawai</span>
              <select
                className="ui-input"
                disabled={isSaving}
                id="face-employee"
                onChange={handleEmployeeChange}
                value={selectedEmployeeId}
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.id} - {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Nama Pegawai</span>
              <strong className="text-base text-brand-brown">{selectedEmployee?.name || '-'}</strong>
            </div>
            <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Jabatan</span>
              <strong className="text-base text-brand-brown">{selectedEmployee?.role || '-'}</strong>
            </div>
            <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Status Wajah</span>
              <StatusBadge tone={selectedEmployee?.faceStatus === 'Terdaftar' ? 'success' : 'warning'}>
                {selectedEmployee?.faceStatus || 'Belum'}
              </StatusBadge>
            </div>
            <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5 md:col-span-3">
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Descriptor</span>
              <strong className="text-base text-brand-brown">
                {descriptor
                  ? `128 nilai tersimpan sementara${detectionScore ? `, confidence ${(detectionScore * 100).toFixed(1)}%` : ''}`
                  : 'Belum diambil'}
              </strong>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Card
          description="Status minimum proses kamera, model, dan descriptor."
          title="Status Sistem"
        >
          <ul className="grid gap-3 p-0">
            {systemStatuses.map((item) => (
              <li
                className="flex min-h-[54px] items-center justify-between gap-3 rounded-[var(--radius-md)] border border-brand-border bg-brand-page px-3.5 py-3 font-bold leading-normal text-brand-brown"
                key={item.label}
              >
                <span>{item.label}</span>
                <StatusBadge tone={getStatusTone(item.status)}>
                  {item.status}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
        <Card
          description="Pantau pegawai yang sudah dan belum memiliki data wajah."
          title="Data Registrasi Wajah"
        >
          <Table
            columns={faceColumns}
            data={employees}
            emptyMessage="Data pegawai tidak ditemukan"
            getRowKey={(row) => row.id}
          />
        </Card>
      </section>
    </>
  )
}

export default FaceRegistrationPage
