import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  RefreshCcw,
  ScanFace,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AlertBanner, Button, Card, Modal, Spinner, StatusBadge } from '../components/ui'
import * as attendanceService from '../services/attendanceService'
import * as faceService from '../services/faceService'

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

function getSaveStatusTone(status) {
  if (status === 'saving') return 'info'
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'

  return 'warning'
}

function AttendancePage() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const cameraInFlightRef = useRef(false)
  const scanInFlightRef = useRef(false)
  const saveInFlightRef = useRef(false)

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
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [modelError, setModelError] = useState('')
  const [scanDescriptor, setScanDescriptor] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

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
  const canSave = verificationStatus === 'verified'
    && Boolean(selectedAttendanceType)
    && Boolean(verifiedEmployee)
    && Boolean(scanDescriptor)
    && saveStatus !== 'saving'
    && saveStatus !== 'success'
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
      setModelError('')

      try {
        const faceapi = await loadFaceApi()

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
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

  const statusSummaries = [
    {
      label: 'Status Kamera',
      text: getCameraStatusText(cameraStatus, isStartingCamera),
      tone: getCameraStatusTone(cameraStatus, isStartingCamera),
    },
    {
      label: 'Status Deteksi',
      text: getScanStatusText(scanStatus, isModelLoading, modelError),
      tone: getScanStatusTone(scanStatus, isModelLoading, modelError),
    },
    {
      label: 'Status Verifikasi',
      text: getVerificationStatusText(verificationStatus),
      tone: getVerificationStatusTone(verificationStatus),
    },
    {
      label: 'Status Absensi',
      text: getSaveStatusText(saveStatus),
      tone: getSaveStatusTone(saveStatus),
    },
  ]

  const stepItems = [
    { complete: Boolean(selectedAttendanceType), label: 'Pilih Jenis' },
    { complete: cameraStatus === 'active', label: 'Kamera' },
    { complete: scanStatus === 'face_detected', label: 'Scan' },
    { complete: verificationStatus === 'verified', label: 'Verifikasi' },
    { complete: saveStatus === 'success', label: 'Simpan' },
  ]
  const firstIncompleteStep = stepItems.findIndex((step) => !step.complete)
  const activeStepIndex = firstIncompleteStep === -1
    ? stepItems.length - 1
    : firstIncompleteStep
  const resultVerificationText = verificationStatus === 'verified'
    ? 'Terverifikasi'
    : 'Menunggu'
  const resultVerificationTone = verificationStatus === 'verified'
    ? 'success'
    : 'warning'

  return (
    <main className="employee-attendance-page mx-auto grid min-h-[100svh] w-full max-w-[480px] content-start gap-4 bg-brand-page p-4 sm:max-w-[760px] sm:p-6 md:max-w-[1120px] md:gap-6 md:p-[32px_var(--page-gutter-desktop)]">
      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-brand-border bg-brand-white p-4 shadow-[var(--shadow-soft)] md:flex md:items-start md:justify-between md:gap-6 md:p-7">
        <div className="grid grid-cols-[46px_minmax(0,1fr)] items-start gap-3">
          <span className="grid h-[46px] w-[46px] place-items-center rounded-[var(--radius-md)] bg-brand-yellow text-brand-brown shadow-[var(--shadow-subtle)]">
            <ScanFace aria-hidden="true" className="h-[23px] w-[23px] stroke-[2.4]" />
          </span>
          <div>
            <h1 className="mb-1.5 text-[28px] leading-tight text-brand-brown sm:text-[34px]">
              Absensi Pegawai
            </h1>
            <p className="mb-0 text-brand-brown-muted">
              Tanpa login. Pilih jenis absensi, lalu lakukan scan wajah.
            </p>
          </div>
        </div>
        <div
          className="grid min-w-0 gap-2 rounded-[var(--radius-md)] border border-brand-border-strong bg-brand-yellow-soft p-3.5 text-left md:min-w-[260px] md:text-right"
          aria-label="Tanggal dan waktu saat ini"
        >
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays aria-hidden="true" className="h-[17px] w-[17px] flex-none stroke-[2.4] text-brand-brown" />
            <span className="min-w-0 text-sm font-bold text-brand-brown-muted">
              {formatDate(now)}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Clock3 aria-hidden="true" className="h-[17px] w-[17px] flex-none stroke-[2.4] text-brand-brown" />
            <strong className="min-w-0 text-2xl leading-none text-brand-brown">
              {formatTime(now)}
            </strong>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-md)] border border-brand-border bg-brand-white p-2 shadow-[var(--shadow-subtle)] sm:p-3">
        <ol className="grid grid-cols-5 gap-1 p-0 sm:gap-2" aria-label="Tahapan absensi">
          {stepItems.map((step, index) => {
            const isActive = index === activeStepIndex

            return (
              <li
                className={`grid min-w-0 justify-items-center gap-1 rounded-[var(--radius-sm)] border px-1 py-2 text-center sm:px-1.5 ${
                  step.complete
                    ? 'border-brand-yellow bg-brand-yellow-soft text-brand-brown'
                    : isActive
                      ? 'border-brand-border-strong bg-brand-page text-brand-brown'
                      : 'border-brand-border bg-brand-white text-brand-brown-muted'
                }`}
                key={step.label}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold ${
                    step.complete
                      ? 'bg-brand-yellow text-brand-brown'
                      : 'bg-brand-page text-brand-brown-muted'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 max-w-full break-words text-[10px] font-extrabold leading-tight sm:text-xs">
                  {step.label}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-brand-border-strong bg-brand-white p-4 shadow-[var(--shadow-soft)] md:flex md:items-center md:justify-between md:gap-5 md:p-6">
        <div>
          <h2 className="mb-2 text-[22px] text-brand-brown md:text-2xl">
            Pilih Jenis Absensi
          </h2>
          <p className="mb-0 text-brand-brown-muted">
            Tentukan jenis absensi yang akan dicatat sebelum melakukan scan wajah.
          </p>
          <p className="mb-0 mt-2 text-sm font-extrabold text-brand-brown">
            Anda memilih: {attendanceLabel}
          </p>
        </div>
        <div
          className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-1"
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
                    ? 'border-brand-yellow bg-brand-yellow text-brand-brown shadow-[var(--shadow-subtle)]'
                    : 'border-transparent bg-transparent text-brand-brown-muted hover:border-brand-border hover:bg-brand-white hover:text-brand-brown'
                }`}
                disabled={isProcessing}
                key={option.value}
                onClick={() => handleAttendanceTypeChange(option.value)}
                type="button"
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px] stroke-[2.4]" />
                <span className="min-w-0 break-words">{option.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {feedbackMessage ? (
        <AlertBanner
          message={feedbackMessage}
          onDismiss={() => setFeedbackMessage(null)}
          tone={feedbackTone}
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <Card className="border-[#f1d37a]" title="Area Scan Wajah">
          <div className="grid gap-[18px]">
            <div
              className="relative grid min-h-[320px] place-items-center overflow-hidden rounded-[var(--radius-md)] border-2 border-dashed border-brand-yellow bg-brand-yellow-soft md:min-h-[420px]"
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
              {cameraStatus !== 'active' || isScanningOrVerifying ? (
                <div className="absolute inset-0 grid place-items-center bg-brand-yellow-soft/95 p-4 text-center">
                  <div className="grid justify-items-center gap-2">
                    <div
                      className="grid aspect-square w-[min(190px,62vw)] place-items-center rounded-[var(--radius-md)] border-[5px] border-brand-yellow bg-brand-white shadow-[var(--shadow-subtle)]"
                      aria-hidden="true"
                    >
                      {isScanningOrVerifying ? (
                        <Spinner size="lg" label="Memindai wajah..." />
                      ) : (
                        <ScanFace className="h-[58px] w-[58px] stroke-[1.9] text-brand-brown" />
                      )}
                    </div>
                    <strong className="text-xl text-brand-brown">
                      {isScanningOrVerifying ? 'Memindai...' : getCameraStatusText(cameraStatus, isStartingCamera)}
                    </strong>
                    <span className="text-sm font-bold text-brand-brown-muted">
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

              {isProcessing ? (
                <Button disabled icon={LogIn} variant="secondary">
                  Portal Admin
                </Button>
              ) : (
                <Button as={Link} icon={LogIn} to="/admin/login" variant="secondary">
                  Portal Admin
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid content-start gap-4">
          <Card title="Status Absensi">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {statusSummaries.map((item) => (
                <div
                  className="grid min-h-[88px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5"
                  key={item.label}
                >
                  <span className="text-[13px] font-extrabold text-brand-brown-muted">
                    {item.label}
                  </span>
                  <StatusBadge tone={item.tone}>{item.text}</StatusBadge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Hasil Verifikasi">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
                <span className="text-[13px] font-extrabold text-brand-brown-muted">Nama Pegawai</span>
                <strong className="text-base text-brand-brown">{verifiedEmployee?.name || '-'}</strong>
              </div>
              <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
                <span className="text-[13px] font-extrabold text-brand-brown-muted">ID Pegawai</span>
                <strong className="text-base text-brand-brown">{verifiedEmployee?.id || '-'}</strong>
              </div>
              <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
                <span className="text-[13px] font-extrabold text-brand-brown-muted">Jenis Absensi</span>
                <StatusBadge>{attendanceLabel}</StatusBadge>
              </div>
              <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
                <span className="text-[13px] font-extrabold text-brand-brown-muted">Status Verifikasi</span>
                <StatusBadge tone={resultVerificationTone}>
                  {resultVerificationText}
                </StatusBadge>
              </div>
              <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
                <span className="text-[13px] font-extrabold text-brand-brown-muted">Status Absensi</span>
                <StatusBadge tone={getSaveStatusTone(saveStatus)}>
                  {getSaveStatusText(saveStatus)}
                </StatusBadge>
              </div>
            </div>
          </Card>
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
