import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  MapPin,
  MapPinOff,
  RefreshCcw,
  ScanFace,
  UserCheck,
} from 'lucide-react'
import { AlertBanner, Button, Modal, Spinner, StatusBadge } from '../components/ui'
import faceScanPlaceholder from '../assets/face-scan-placeholder.png'
import * as attendanceService from '../services/attendanceService'
import * as faceService from '../services/faceService'
import { useGeolocation } from '../utils/useGeolocation'

const MODEL_URL = '/models'
const DESCRIPTOR_LENGTH = 128
let faceApiModulePromise = null

const attendanceOptions = [
  { icon: LogIn, label: 'Masuk', value: 'masuk' },
  { icon: LogOut, label: 'Pulang', value: 'pulang' },
]

function loadFaceApi() {
  if (!faceApiModulePromise) {
    faceApiModulePromise = import('face-api.js')
  }

  return faceApiModulePromise
}

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

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

function getAttendanceLabel(type) {
  return type === 'pulang' ? 'Absensi Pulang' : 'Absensi Masuk'
}

function getAttendanceActionLabel(type) {
  return type === 'pulang' ? 'Pulang' : 'Masuk'
}

function normalizeDescriptor(value) {
  const descriptor = Array.from(value || []).map((item) => Number(item))

  if (descriptor.length !== DESCRIPTOR_LENGTH) {
    throw new Error('Descriptor wajah tidak valid. Silakan scan ulang.')
  }

  if (descriptor.some((item) => !Number.isFinite(item))) {
    throw new Error('Descriptor wajah berisi nilai tidak valid. Silakan scan ulang.')
  }

  return descriptor
}

function getErrorMessage(err, fallback) {
  if (err?.status === 0) {
    return 'Koneksi bermasalah atau server tidak merespons. Silakan coba lagi.'
  }

  return err?.message || fallback
}

function getCameraErrorMessage(err) {
  if (
    err?.name === 'NotAllowedError'
    || err?.name === 'PermissionDeniedError'
    || err?.name === 'NotFoundError'
    || err?.name === 'DevicesNotFoundError'
    || err?.name === 'NotReadableError'
    || err?.name === 'TrackStartError'
  ) {
    return 'Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.'
  }

  return getErrorMessage(err, 'Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.')
}

function getCameraStatusText(status, isStartingCamera) {
  if (isStartingCamera) return 'Mengaktifkan kamera...'
  if (status === 'active') return 'Kamera aktif'
  if (status === 'error') return 'Kamera gagal diakses'

  return 'Kamera belum aktif'
}

function getScanStatusText(status, isModelLoading, modelError) {
  if (modelError) return 'Model wajah gagal dimuat'
  if (isModelLoading) return 'Memuat model wajah...'
  if (status === 'scanning') return 'Sedang memindai wajah...'
  if (status === 'face_detected') return 'Wajah berhasil terdeteksi'
  if (status === 'face_not_detected') return 'Wajah tidak terdeteksi'
  if (status === 'failed') return 'Scan wajah gagal'

  return 'Menunggu scan wajah'
}

function getVerificationStatusText(status) {
  if (status === 'verifying') return 'Sedang mencocokkan wajah...'
  if (status === 'verified') return 'Terverifikasi'
  if (status === 'not_found') return 'Pegawai tidak ditemukan'
  if (status === 'failed') return 'Verifikasi gagal'

  return 'Belum diverifikasi'
}

function getSaveStatusText(status) {
  if (status === 'saving') return 'Sedang menyimpan absensi...'
  if (status === 'success') return 'Absensi berhasil disimpan'
  if (status === 'failed') return 'Gagal menyimpan absensi'

  return 'Belum disimpan'
}

function getCameraStatusTone(status, isStartingCamera) {
  if (isStartingCamera) return 'info'
  if (status === 'active') return 'success'
  if (status === 'error') return 'danger'

  return 'warning'
}

function getScanStatusTone(status, isModelLoading, modelError) {
  if (isModelLoading || status === 'scanning') return 'info'
  if (status === 'face_detected') return 'success'
  if (modelError || status === 'face_not_detected' || status === 'failed') return 'danger'

  return 'warning'
}

function getVerificationStatusTone(status) {
  if (status === 'verifying') return 'info'
  if (status === 'verified') return 'success'
  if (status === 'not_found' || status === 'failed') return 'danger'

  return 'warning'
}

function getGeoStatusText(status) {
  if (status === 'requesting') return 'Mengambil lokasi...'
  if (status === 'granted') return 'Lokasi terdeteksi'
  if (status === 'denied') return 'Izin lokasi ditolak'
  if (status === 'unavailable') return 'Lokasi tidak tersedia'

  return 'Lokasi belum diizinkan'
}

function getGeoStatusTone(status) {
  if (status === 'requesting') return 'info'
  if (status === 'granted') return 'success'
  if (status === 'denied' || status === 'unavailable') return 'danger'

  return 'warning'
}

function getSaveStatusTone(status) {
  if (status === 'saving') return 'info'
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'

  return 'warning'
}

// ── Location Status Card ────────────────────────────────────────────────────
function LocationStatusCard({ geoState, onRequest }) {
  const tone = getGeoStatusTone(geoState.status)
  const isRequesting = geoState.status === 'requesting'
  const isGranted = geoState.status === 'granted'
  const isDeniedOrUnavailable = geoState.status === 'denied' || geoState.status === 'unavailable'

  return (
    <section className="arc-card" style={{ marginBottom: 0 }}>
      <header className="arc-header">
        {isGranted ? (
          <MapPin className="arc-header-icon" aria-hidden="true" />
        ) : (
          <MapPinOff className="arc-header-icon" aria-hidden="true" />
        )}
        <h2 className="arc-header-title">Lokasi GPS</h2>
      </header>

      <div className="arc-body" style={{ gap: '12px' }}>
        <StatusBadge tone={tone}>
          {isRequesting && <Spinner size="sm" label="" />}
          {' '}{getGeoStatusText(geoState.status)}
        </StatusBadge>

        {isGranted && (
          <dl className="arc-meta-list">
            <div className="arc-meta-row">
              <dt>Latitude</dt>
              <dd><strong className="arc-meta-time">{geoState.latitude?.toFixed(6)}</strong></dd>
            </div>
            <div className="arc-meta-row">
              <dt>Longitude</dt>
              <dd><strong className="arc-meta-time">{geoState.longitude?.toFixed(6)}</strong></dd>
            </div>
            {geoState.accuracy != null && (
              <div className="arc-meta-row">
                <dt>Akurasi</dt>
                <dd><StatusBadge tone={geoState.accuracy <= 50 ? 'success' : 'warning'}>±{Math.round(geoState.accuracy)} m</StatusBadge></dd>
              </div>
            )}
          </dl>
        )}

        {geoState.error && (
          <p style={{ fontSize: '13px', color: 'var(--color-danger, #e53e3e)', margin: 0 }}>
            {geoState.error}
          </p>
        )}

        {!isGranted && !isRequesting && (
          <Button
            icon={MapPin}
            isLoading={isRequesting}
            loadingText="Mengambil lokasi..."
            onClick={onRequest}
            variant={isDeniedOrUnavailable ? 'secondary' : 'primary'}
          >
            {isDeniedOrUnavailable ? 'Coba Lagi' : 'Izinkan Lokasi'}
          </Button>
        )}
      </div>
    </section>
  )
}

function ProgressBar({ steps }) {
  const completedCount = steps.filter((s) => s.complete).length
  const fillPercent = steps.length > 1
    ? (completedCount / (steps.length - 1)) * 100
    : 0
  const firstIncomplete = steps.findIndex((s) => !s.complete)
  const activeIndex = firstIncomplete === -1 ? steps.length - 1 : firstIncomplete

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-labels">
        {steps.map((step, i) => (
          <span
            className={`progress-bar-label ${step.complete ? 'complete' : i === activeIndex ? 'active' : ''}`}
            key={step.label}
          >
            {step.label}
          </span>
        ))}
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(fillPercent, 100)}%` }}
        />
      </div>
      <div className="progress-bar-dots">
        {steps.map((step, i) => (
          <span
            className={`progress-bar-dot ${step.complete ? 'complete' : i === activeIndex ? 'active' : ''}`}
            key={step.label}
          >
            <span className="progress-bar-dot-inner" />
          </span>
        ))}
      </div>
    </div>
  )
}

function AttendanceSection({ children, className = '', description, title }) {
  return (
    <section className={`attendance-flat-section ${className}`.trim()}>
      {title || description ? (
        <header className="attendance-flat-header">
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </header>
      ) : null}
      <div className="attendance-flat-body">{children}</div>
    </section>
  )
}

function AttendanceInfoTile({ children, label }) {
  return (
    <div className="attendance-info-tile">
      <span>{label}</span>
      {children}
    </div>
  )
}

function FaceScanStartImage() {
  return (
    <img
      alt=""
      aria-hidden="true"
      className="h-auto w-[min(240px,68vw)] max-w-full object-contain"
      src={faceScanPlaceholder}
    />
  )
}

// ── Model Loading Splash ───────────────────────────────────────────────────
function ModelLoadingSplash({ progress, error }) {
  return (
    <div className="aml-splash" role="status" aria-label="Memuat sistem pengenalan wajah">
      <div className="aml-splash-card">
        <div className="aml-splash-icon" aria-hidden="true">
          {error ? (
            <ScanFace className="h-10 w-10 stroke-[1.5] text-brand-danger" />
          ) : (
            <ScanFace className="h-10 w-10 stroke-[1.5] text-brand-primary" />
          )}
        </div>
        <div className="aml-splash-copy">
          <strong className="aml-splash-title">
            {error ? 'Gagal Memuat Sistem' : 'Menyiapkan Sistem Absensi'}
          </strong>
          <p className="aml-splash-desc">
            {error
              ? error
              : 'Harap tunggu, model pengenalan wajah sedang dimuat...'}
          </p>
        </div>
        {!error && (
          <div className="aml-progress-wrap" aria-hidden="true">
            <div className="aml-progress-track">
              <div
                className="aml-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="aml-progress-label">{progress}%</span>
          </div>
        )}
        {error && (
          <button
            className="aml-reload-btn"
            onClick={() => window.location.reload()}
            type="button"
          >
            Muat Ulang Halaman
          </button>
        )}
      </div>
    </div>
  )
}

function AttendanceResultCard({ attendanceLabel, saveStatus, verificationStatus, verifiedEmployee, now }) {
  // ── Success state ─────────────────────────────────────────────
  if (saveStatus === 'success') {
    return (
      <section className="arc-card arc-card--success">
        <div className="arc-success-icon" aria-hidden="true">
          <CheckCircle2 className="h-7 w-7 stroke-[1.8]" />
        </div>
        <div className="arc-success-body">
          <p className="arc-success-title">Absensi Berhasil!</p>
          <strong className="arc-success-name">{verifiedEmployee?.name || '—'}</strong>
          <p className="arc-success-meta">
            {attendanceLabel}
            {' · '}
            {formatTime(now)}
          </p>
        </div>
      </section>
    )
  }

  // ── Verified state ────────────────────────────────────────────
  if (verificationStatus === 'verified' && verifiedEmployee) {
    return (
      <section className="arc-card">
        <header className="arc-header">
          <UserCheck className="arc-header-icon" aria-hidden="true" />
          <h2 className="arc-header-title">Hasil Verifikasi</h2>
        </header>
        <div className="arc-body">
          <StatusBadge tone="success">Wajah Terverifikasi</StatusBadge>
          <div className="arc-identity">
            <p className="arc-identity-name">{verifiedEmployee.name}</p>
            <p className="arc-identity-id">ID: {verifiedEmployee.id || '—'}</p>
          </div>
          <dl className="arc-meta-list">
            <div className="arc-meta-row">
              <dt>Jenis</dt>
              <dd><StatusBadge tone="info">{attendanceLabel}</StatusBadge></dd>
            </div>
            <div className="arc-meta-row">
              <dt>Waktu</dt>
              <dd><strong className="arc-meta-time">{formatTime(now)}</strong></dd>
            </div>
            <div className="arc-meta-row">
              <dt>Status</dt>
              <dd><StatusBadge tone="warning">Belum Disimpan</StatusBadge></dd>
            </div>
          </dl>
        </div>
      </section>
    )
  }

  // ── Idle / failed state ───────────────────────────────────────
  return (
    <section className="arc-card arc-card--idle">
      <header className="arc-header">
        <UserCheck className="arc-header-icon" aria-hidden="true" />
        <h2 className="arc-header-title">Hasil Verifikasi</h2>
      </header>
      <div className="arc-idle-body">
        <span className="arc-idle-icon" aria-hidden="true">
          <ScanFace className="h-8 w-8 stroke-[1.5] text-brand-muted" />
        </span>
        <p className="arc-idle-text">
          Belum ada data. Aktifkan kamera dan lakukan scan wajah untuk memulai proses absensi.
        </p>
      </div>
    </section>
  )
}

function AttendancePage() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const cameraInFlightRef = useRef(false)
  const scanInFlightRef = useRef(false)
  const saveInFlightRef = useRef(false)

  const { geoState, requestLocation } = useGeolocation()

  const [selectedAttendanceType, setSelectedAttendanceType] = useState('masuk')
  const [cameraStatus, setCameraStatus] = useState('inactive')
  const [scanStatus, setScanStatus] = useState('idle')
  const [verificationStatus, setVerificationStatus] = useState('idle')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [verifiedEmployee, setVerifiedEmployee] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [feedbackTone, setFeedbackTone] = useState('success')

  const [now, setNow] = useState(() => new Date())
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [modelLoadProgress, setModelLoadProgress] = useState(0)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [modelError, setModelError] = useState('')
  const [scanDescriptor, setScanDescriptor] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const isLocationGranted = geoState.status === 'granted'

  const attendanceLabel = getAttendanceLabel(selectedAttendanceType)
  const attendanceActionLabel = getAttendanceActionLabel(selectedAttendanceType)
  const isScanningOrVerifying = scanStatus === 'scanning' || verificationStatus === 'verifying'
  const isSaving = saveStatus === 'saving'
  const isProcessing = isStartingCamera || isScanningOrVerifying || isSaving
  const canScan = cameraStatus === 'active'
    && !isModelLoading
    && !modelError
    && !isProcessing
    && saveStatus !== 'success'
    && isLocationGranted
  const canSave = verificationStatus === 'verified'
    && Boolean(selectedAttendanceType)
    && Boolean(verifiedEmployee)
    && Boolean(scanDescriptor)
    && saveStatus !== 'saving'
    && saveStatus !== 'success'
    && isLocationGranted
  const hasScanProgress = scanStatus !== 'idle'
    || verificationStatus !== 'idle'
    || saveStatus !== 'idle'
    || Boolean(verifiedEmployee)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let isCurrent = true

    async function loadModels() {
      setIsModelLoading(true)
      setModelLoadProgress(10)
      setModelError('')

      try {
        const faceapi = await loadFaceApi()
        setModelLoadProgress(30)

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        setModelLoadProgress(55)

        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL)
        setModelLoadProgress(80)

        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        setModelLoadProgress(100)
      } catch (err) {
        if (isCurrent) {
          const message = getErrorMessage(err, 'Model wajah gagal dimuat. Silakan muat ulang halaman.')

          setModelError(message)
          showFeedback(message, 'error')
        }
      } finally {
        if (isCurrent) {
          setIsModelLoading(false)
        }
      }
    }

    loadModels()

    return () => {
      isCurrent = false
      stopStream(streamRef.current)
    }
  }, [])

  function showFeedback(message, tone = 'success') {
    setFeedbackMessage(message)
    setFeedbackTone(tone)
  }

  function clearProgress({ clearFeedback = true } = {}) {
    setScanStatus('idle')
    setVerificationStatus('idle')
    setSaveStatus('idle')
    setVerifiedEmployee(null)
    setScanDescriptor(null)
    setShowConfirm(false)

    if (clearFeedback) {
      setFeedbackMessage(null)
    }
  }

  function handleAttendanceTypeChange(nextType) {
    if (isProcessing || nextType === selectedAttendanceType) {
      return
    }

    setSelectedAttendanceType(nextType)

    if (verifiedEmployee || saveStatus === 'success') {
      clearProgress()
    }
  }

  async function handleStartCamera() {
    if (isProcessing || cameraInFlightRef.current) {
      return
    }

    setFeedbackMessage(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      const message = 'Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.'

      setCameraStatus('error')
      clearProgress({ clearFeedback: false })
      showFeedback(message, 'error')
      return
    }

    setIsStartingCamera(true)
    cameraInFlightRef.current = true

    try {
      stopStream(streamRef.current)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          height: { ideal: 480 },
          width: { ideal: 640 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraStatus('active')
      clearProgress({ clearFeedback: false })
      showFeedback('Kamera aktif. Lanjutkan dengan scan wajah.', 'success')
    } catch (err) {
      const message = getCameraErrorMessage(err)

      setCameraStatus('error')
      clearProgress({ clearFeedback: false })
      showFeedback(message, 'error')
    } finally {
      cameraInFlightRef.current = false
      setIsStartingCamera(false)
    }
  }

  function handleStopCamera() {
    if (isProcessing || cameraInFlightRef.current) {
      return
    }

    stopStream(streamRef.current)
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraStatus('inactive')
    clearProgress()
  }

  async function handleStartScan() {
    if (scanInFlightRef.current || !canScan) {
      if (!isLocationGranted) {
        showFeedback('Izinkan akses lokasi terlebih dahulu sebelum scan wajah.', 'error')
        return
      }
      if (cameraStatus !== 'active') {
        showFeedback('Aktifkan kamera sebelum scan wajah.', 'error')
      }

      return
    }

    setScanStatus('scanning')
    setVerificationStatus('verifying')
    setSaveStatus('idle')
    setVerifiedEmployee(null)
    setScanDescriptor(null)
    setFeedbackMessage(null)
    scanInFlightRef.current = true

    try {
      if (isModelLoading || modelError) {
        throw new Error(modelError || 'Model wajah masih dimuat. Silakan tunggu sebentar.')
      }

      if (!videoRef.current) {
        throw new Error('Kamera belum siap. Aktifkan kamera lalu coba lagi.')
      }

      const faceapi = await loadFaceApi()
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
        setScanStatus('face_not_detected')
        setVerificationStatus('failed')
        showFeedback(
          'Wajah belum terdeteksi. Posisikan wajah di tengah kamera lalu coba lagi.',
          'error',
        )
        return
      }

      const descriptor = normalizeDescriptor(detection.descriptor)
      const result = await faceService.verifyFace({ descriptor })

      if (result.matched) {
        const employee = result.employee || {
          id: result.employeeId,
          name: result.employeeName || 'Pegawai terverifikasi',
        }

        setScanStatus('face_detected')
        setVerificationStatus('verified')
        setSaveStatus('idle')
        setVerifiedEmployee(employee)
        setScanDescriptor(descriptor)
        showFeedback(
          `Wajah cocok dengan ${employee.name}. Lanjutkan simpan absensi.`,
          'success',
        )
        return
      }

      setScanStatus('face_detected')
      setVerificationStatus('not_found')
      setVerifiedEmployee(null)
      setScanDescriptor(null)
      showFeedback('Wajah tidak cocok dengan data pegawai yang terdaftar.', 'error')
    } catch (err) {
      setScanStatus('failed')
      setVerificationStatus('failed')
      setVerifiedEmployee(null)
      setScanDescriptor(null)
      showFeedback(
        getErrorMessage(err, 'Wajah tidak cocok dengan data pegawai yang terdaftar.'),
        'error',
      )
    } finally {
      scanInFlightRef.current = false
    }
  }

  function handleResetScan() {
    if (isSaving || scanInFlightRef.current || saveInFlightRef.current) {
      return
    }

    clearProgress()
  }

  function handleNextEmployee() {
    if (isSaving || scanInFlightRef.current || saveInFlightRef.current) {
      return
    }

    clearProgress()
  }

  function handleSubmitClick() {
    if (!canSave) {
      return
    }

    setShowConfirm(true)
  }

  async function handleConfirmSubmit() {
    if (!canSave || saveInFlightRef.current || saveStatus === 'success') {
      return
    }

    setShowConfirm(false)
    setSaveStatus('saving')
    setFeedbackMessage(null)
    saveInFlightRef.current = true

    try {
      const payload = {
        descriptor: scanDescriptor,
        employeeId: verifiedEmployee.id,
        method: 'Face Recognition',
        latitude: geoState.latitude,
        longitude: geoState.longitude,
      }

      if (selectedAttendanceType === 'masuk') {
        const record = await attendanceService.checkIn(payload)
        const savedTime = record.checkIn || formatTime(new Date())

        setSaveStatus('success')
        showFeedback(
          `Absensi ${attendanceActionLabel} ${verifiedEmployee.name} berhasil disimpan pada ${savedTime}.`,
          'success',
        )
      } else {
        const record = await attendanceService.checkOut(payload)
        const savedTime = record.checkOut || formatTime(new Date())

        setSaveStatus('success')
        showFeedback(
          `Absensi ${attendanceActionLabel} ${verifiedEmployee.name} berhasil disimpan pada ${savedTime}.`,
          'success',
        )
      }

    } catch (error) {
      setSaveStatus('failed')
      showFeedback(
        error?.message || 'Gagal menyimpan absensi. Silakan coba lagi.',
        'error',
      )
    } finally {
      saveInFlightRef.current = false
    }
  }



  const stepItems = [
    { complete: Boolean(selectedAttendanceType), label: 'Pilih Jenis' },
    { complete: isLocationGranted, label: 'Lokasi' },
    { complete: cameraStatus === 'active', label: 'Kamera' },
    { complete: scanStatus === 'face_detected', label: 'Scan' },
    { complete: verificationStatus === 'verified', label: 'Verifikasi' },
    { complete: saveStatus === 'success', label: 'Simpan' },
  ]

  if (isModelLoading || modelError) {
    return (
      <ModelLoadingSplash
        error={modelError}
        progress={modelLoadProgress}
      />
    )
  }

  return (
    <main className="employee-attendance-page mx-auto grid min-h-[100svh] w-full max-w-[480px] content-start gap-4 bg-brand-page p-4 sm:max-w-[760px] sm:p-6 md:max-w-[1120px] md:gap-6 md:p-[32px_var(--page-gutter-desktop)]">
      <section className="attendance-hero">
        <div className="attendance-hero-title">
          <span className="attendance-hero-icon">
            <ScanFace aria-hidden="true" className="h-[23px] w-[23px] stroke-[1.8]" />
          </span>
          <h1 className="attendance-hero-heading">
            Absensi Pegawai
          </h1>
        </div>
        <div
          className="attendance-clock-strip"
          aria-label="Tanggal dan waktu saat ini"
        >
          <div className="attendance-clock-date">
            <CalendarDays aria-hidden="true" className="attendance-clock-icon" />
            <span>{formatDate(now)}</span>
          </div>
          <div className="attendance-clock-time">
            <Clock3 aria-hidden="true" className="attendance-clock-icon" />
            <strong>{formatTime(now)}</strong>
          </div>
        </div>
      </section>

      {/* Horizontal progress bar replacing the old step badges */}
      <ProgressBar steps={stepItems} />

      <div
        className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-brand-border bg-brand-surface-muted p-1"
        role="group"
        aria-label="Pilih jenis absensi"
      >
        {attendanceOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedAttendanceType === option.value

          return (
            <button
              aria-pressed={isSelected}
              className={`grid min-h-[46px] min-w-0 grid-cols-[18px_minmax(0,auto)] place-content-center items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-[15px] font-extrabold transition-[background,border-color] ${
                isSelected
                  ? 'border-brand-blue bg-brand-blue text-white shadow-[var(--shadow-subtle)]'
                  : 'border-transparent bg-transparent text-brand-muted hover:border-brand-border hover:bg-brand-white hover:text-brand-heading'
              }`}
              disabled={isProcessing}
              key={option.value}
              onClick={() => handleAttendanceTypeChange(option.value)}
              type="button"
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px] stroke-[1.8]" />
              <span className="min-w-0 break-words">{option.label}</span>
            </button>
          )
        })}
      </div>

      {feedbackMessage ? (
        <AlertBanner
          message={feedbackMessage}
          onDismiss={() => setFeedbackMessage(null)}
          tone={feedbackTone}
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <AttendanceSection
          className="attendance-scan-section"
          title="Area Scan Wajah"
        >
          <div className="grid gap-[18px]">
            <div
              className="relative grid min-h-[320px] place-items-center overflow-hidden rounded-[var(--radius-md)] border border-brand-border bg-brand-white md:min-h-[420px]"
              aria-label="Area Scan Wajah"
            >
              <video
                aria-label="Pratinjau kamera absensi wajah"
                autoPlay
                className="h-full min-h-[320px] w-full object-cover md:min-h-[420px]"
                muted
                playsInline
                ref={videoRef}
              />
              {/* Oval face guide — shown when camera active and not scanning */}
              {cameraStatus === 'active' && !isScanningOrVerifying ? (
                <div className="afc-guide" aria-hidden="true">
                  <div className="afc-oval" />
                  <span className="afc-guide-label">Posisikan wajah di dalam area</span>
                </div>
              ) : null}
              {cameraStatus !== 'active' || isScanningOrVerifying ? (
                <div className="absolute inset-0 grid place-items-center bg-brand-white/95 p-4 text-center">
                  <div className="grid justify-items-center gap-2">
                    {isScanningOrVerifying ? (
                      <div
                        className="grid aspect-square w-[min(160px,52vw)] place-items-center rounded-[var(--radius-md)] bg-brand-white shadow-[var(--shadow-subtle)]"
                        aria-hidden="true"
                      >
                        <Spinner size="lg" label="Memindai wajah..." />
                      </div>
                    ) : (
                      <FaceScanStartImage />
                    )}
                    <strong className="text-xl text-brand-heading">
                      {isScanningOrVerifying ? 'Memindai...' : getCameraStatusText(cameraStatus, isStartingCamera)}
                    </strong>
                    <span className="text-sm font-bold text-brand-muted">
                      {isScanningOrVerifying
                        ? getVerificationStatusText(verificationStatus)
                        : getScanStatusText(scanStatus, isModelLoading, modelError)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:flex md:flex-wrap md:justify-end">
              {cameraStatus === 'active' ? (
                <Button
                  disabled={isProcessing}
                  icon={CameraOff}
                  onClick={handleStopCamera}
                  variant="secondary"
                >
                  Matikan Kamera
                </Button>
              ) : (
                <Button
                  disabled={isProcessing}
                  icon={Camera}
                  isLoading={isStartingCamera}
                  loadingText="Mengaktifkan..."
                  onClick={handleStartCamera}
                >
                  Aktifkan Kamera
                </Button>
              )}

              {cameraStatus === 'active' && saveStatus !== 'success' && verificationStatus !== 'verified' ? (
                <Button
                  disabled={!canScan}
                  icon={ScanFace}
                  isLoading={isScanningOrVerifying}
                  loadingText="Memindai..."
                  onClick={handleStartScan}
                >
                  Scan Wajah
                </Button>
              ) : null}

              {verificationStatus === 'verified' && saveStatus !== 'success' ? (
                <>
                  <Button
                    disabled={isSaving}
                    icon={RefreshCcw}
                    onClick={handleResetScan}
                    variant="secondary"
                  >
                    Scan Ulang
                  </Button>
                  <Button
                    disabled={!canSave}
                    icon={CheckCircle2}
                    isLoading={isSaving}
                    loadingText="Menyimpan..."
                    onClick={handleSubmitClick}
                  >
                    Konfirmasi & Simpan {attendanceLabel}
                  </Button>
                </>
              ) : null}

              {saveStatus === 'success' ? (
                <>
                  <Button icon={ScanFace} onClick={handleNextEmployee}>
                    Scan Pegawai Berikutnya
                  </Button>
                  <Button
                    icon={RefreshCcw}
                    onClick={handleResetScan}
                    variant="secondary"
                  >
                    Ulangi Scan
                  </Button>
                </>
              ) : null}

              {hasScanProgress && saveStatus !== 'success' && verificationStatus !== 'verified' ? (
                <Button
                  disabled={isProcessing}
                  icon={RefreshCcw}
                  onClick={handleResetScan}
                  variant="ghost"
                >
                  Ulangi Scan
                </Button>
              ) : null}

            </div>
          </div>
        </AttendanceSection>

        <div className="grid content-start gap-4">
          <LocationStatusCard
            geoState={geoState}
            onRequest={requestLocation}
          />
          <AttendanceResultCard
            attendanceLabel={attendanceLabel}
            saveStatus={saveStatus}
            verificationStatus={verificationStatus}
            verifiedEmployee={verifiedEmployee}
            now={now}
          />
        </div>
      </section>

      <Modal
        isOpen={showConfirm}
        onClose={() => {
          if (!isSaving) {
            setShowConfirm(false)
          }
        }}
        title="Konfirmasi Absensi Pegawai"
        footer={
          <>
            <Button
              disabled={!canSave}
              isLoading={isSaving}
              loadingText="Menyimpan..."
              onClick={handleConfirmSubmit}
            >
              Ya, Simpan
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => setShowConfirm(false)}
              variant="secondary"
            >
              Batal
            </Button>
          </>
        }
      >
        <p>
          Simpan <strong>{attendanceLabel}</strong> untuk{' '}
          <strong>{verifiedEmployee?.name || 'pegawai terverifikasi'}</strong>?
        </p>
      </Modal>
    </main>
  )
}

export default AttendancePage
