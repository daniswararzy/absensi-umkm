import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import {
  ArrowLeft, CalendarDays, Camera, CheckCircle2, Clock3,
  LogIn, LogOut, RefreshCcw, ScanFace, XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AlertBanner, Button, Card, Modal, Spinner, StatusBadge } from '../components/ui'
import * as attendanceService from '../services/attendanceService'
import * as faceService from '../services/faceService'

const MODEL_URL = '/models'
const attendanceTypes = [
  { icon: LogIn, label: 'Absensi Masuk' },
  { icon: LogOut, label: 'Absensi Pulang' },
]

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

function formatDate(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatTime(date) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function AttendancePage() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [attendanceType, setAttendanceType] = useState('Absensi Masuk')
  const [now, setNow] = useState(() => new Date())

  // Scan flow states
  const [scanPhase, setScanPhase] = useState('idle') // idle | scanning | success | error
  const [isScanning, setIsScanning] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanError, setScanError] = useState('')
  const [modelError, setModelError] = useState('')

  // Submit flow states
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

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

    return () => {
      isCurrent = false
      stopStream(streamRef.current)
    }
  }, [])

  async function handleStartCamera() {
    setScanError('')
    setFeedback(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanPhase('error')
      setScanError('Browser tidak mendukung akses kamera')
      return
    }

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

      setIsCameraActive(true)
      setScanPhase('idle')
      setScanResult(null)
    } catch (err) {
      setIsCameraActive(false)
      setScanPhase('error')
      setScanError(err.message || 'Gagal mengaktifkan kamera')
    }
  }

  // Start scan — captures a descriptor and verifies it through the API.
  async function handleStartScan() {
    setIsScanning(true)
    setScanPhase('scanning')
    setScanError('')
    setScanResult(null)
    setFeedback(null)

    try {
      if (isModelLoading || modelError) {
        throw new Error(modelError || 'Model face-api.js masih dimuat')
      }

      if (!videoRef.current || !isCameraActive) {
        throw new Error('Aktifkan kamera sebelum memulai scan')
      }

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
        throw new Error('Wajah tidak terdeteksi. Hadapkan wajah ke kamera lalu coba lagi.')
      }

      const result = await faceService.verifyFace({
        descriptor: Array.from(detection.descriptor),
      })

      if (result.matched) {
        setScanResult(result)
        setScanPhase('success')
      } else {
        setScanPhase('error')
        setScanError(result.message || 'Wajah tidak dikenali dalam sistem')
      }
    } catch (err) {
      setScanPhase('error')
      setScanError(err.message || 'Gagal memproses pemindaian wajah')
    } finally {
      setIsScanning(false)
    }
  }

  function handleResetScan() {
    setScanPhase('idle')
    setScanResult(null)
    setScanError('')
    setFeedback(null)
  }

  // Confirm + submit attendance
  function handleSubmitClick() {
    setShowConfirm(true)
  }

  async function handleConfirmSubmit() {
    setShowConfirm(false)
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const payload = {
        employeeId: scanResult?.employeeId,
        method: 'Face Recognition',
      }

      if (attendanceType === 'Absensi Masuk') {
        await attendanceService.checkIn(payload)
      } else {
        await attendanceService.checkOut(payload)
      }

      setFeedback({
        tone: 'success',
        message: `${attendanceType} berhasil dicatat untuk ${scanResult?.employeeName || 'pegawai terverifikasi'}`,
      })
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err.message || 'Gagal menyimpan data absensi',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Derive scan status text
  function getScanStatusText() {
    if (scanPhase === 'scanning') return 'Memproses data wajah...'
    if (scanPhase === 'success') return 'Wajah berhasil terdeteksi'
    if (scanPhase === 'error') return scanError || 'Wajah tidak dikenali'
    if (modelError) return 'Model wajah gagal dimuat'
    if (isModelLoading) return 'Memuat model wajah...'
    if (!isCameraActive) return 'Kamera belum aktif'
    return 'Menunggu pemindaian wajah'
  }

  function getScanStatusTone() {
    if (scanPhase === 'success') return 'success'
    if (scanPhase === 'error') return 'danger'
    if (scanPhase === 'scanning') return 'info'
    return 'info'
  }

  const verifiedEmployee = scanResult
    ? { name: scanResult.employeeName, id: scanResult.employeeId }
    : null

  return (
    <main className="mx-auto grid min-h-[100svh] w-full max-w-[480px] content-start gap-4 bg-brand-page p-4 sm:max-w-[760px] sm:p-6 md:max-w-[1120px] md:gap-6 md:p-[32px_var(--page-gutter-desktop)]">
      {/* Header */}
      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-brand-border bg-brand-white p-4 shadow-[var(--shadow-soft)] md:flex md:items-start md:justify-between md:gap-6 md:p-7">
        <div className="grid grid-cols-[46px_minmax(0,1fr)] items-start gap-3">
          <span className="grid h-[46px] w-[46px] place-items-center rounded-[var(--radius-md)] bg-brand-yellow text-brand-brown shadow-[var(--shadow-subtle)]">
            <ScanFace aria-hidden="true" className="h-[23px] w-[23px] stroke-[2.4]" />
          </span>
          <div>
            <h1 className="mb-1.5 text-[28px] leading-tight text-brand-brown sm:text-[34px]">Absensi Pegawai</h1>
            <p className="mb-0 text-brand-brown-muted">Silakan pilih jenis absensi dan lakukan pemindaian wajah</p>
          </div>
        </div>
        <div className="grid min-w-0 gap-2 rounded-[var(--radius-md)] border border-brand-border-strong bg-brand-yellow-soft p-3.5 text-left md:min-w-[260px] md:text-right" aria-label="Tanggal dan waktu saat ini">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays aria-hidden="true" className="h-[17px] w-[17px] flex-none stroke-[2.4] text-brand-brown" />
            <span className="min-w-0 text-sm font-bold text-brand-brown-muted">{formatDate(now)}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Clock3 aria-hidden="true" className="h-[17px] w-[17px] flex-none stroke-[2.4] text-brand-brown" />
            <strong className="min-w-0 text-2xl leading-none text-brand-brown">{formatTime(now)}</strong>
          </div>
        </div>
      </section>

      {/* Attendance type selector */}
      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-brand-border-strong bg-brand-white p-4 shadow-[var(--shadow-soft)] md:flex md:items-center md:justify-between md:gap-5 md:p-6">
        <div>
          <h2 className="mb-2 text-[22px] text-brand-brown md:text-2xl">Jenis Absensi</h2>
          <p className="mb-0 text-brand-brown-muted">Pilih salah satu jenis absensi sebelum memulai scan wajah.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Jenis absensi">
          {attendanceTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                className={`flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-[15px] font-extrabold transition-[background,border-color,transform] hover:-translate-y-px hover:border-[#f1d37a] hover:bg-brand-yellow-soft ${
                  attendanceType === type.label
                    ? 'border-brand-yellow bg-brand-yellow text-brand-brown shadow-[var(--shadow-subtle)]'
                    : 'border-brand-border bg-brand-white text-brand-brown'
                }`}
                disabled={isScanning || isSubmitting}
                key={type.label}
                onClick={() => setAttendanceType(type.label)}
                type="button"
              >
                <Icon aria-hidden="true" className="h-[19px] w-[19px] stroke-[2.4]" />
                <span>{type.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Feedback banner */}
      {feedback ? (
        <AlertBanner message={feedback.message} onDismiss={() => setFeedback(null)} tone={feedback.tone} />
      ) : null}

      {/* Scan area + results */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <Card className="border-[#f1d37a]" title="Area Scan Wajah">
          <div className="grid gap-[18px]">
            <div className="relative grid min-h-[320px] place-items-center overflow-hidden rounded-[var(--radius-md)] border-2 border-dashed border-brand-yellow bg-brand-yellow-soft md:min-h-[420px]" aria-label="Area Scan Wajah">
              <video
                aria-label="Pratinjau kamera absensi wajah"
                autoPlay
                className="h-full min-h-[320px] w-full object-cover md:min-h-[420px]"
                muted
                playsInline
                ref={videoRef}
              />
              {!isCameraActive || isScanning ? (
                <div className="absolute inset-0 grid place-items-center bg-brand-yellow-soft/95 p-4 text-center">
                  <div className="grid justify-items-center gap-2">
                    <div className="grid aspect-square w-[min(190px,62vw)] place-items-center rounded-[var(--radius-md)] border-[5px] border-brand-yellow bg-brand-white shadow-[var(--shadow-subtle)]" aria-hidden="true">
                      {isScanning ? (
                        <Spinner size="lg" label="Memindai wajah..." />
                      ) : (
                        <ScanFace className="h-[58px] w-[58px] stroke-[1.9] text-brand-brown" />
                      )}
                    </div>
                    <strong className="text-xl text-brand-brown">
                      {isScanning ? 'Memindai...' : 'Area Scan Wajah'}
                    </strong>
                    <span className="text-sm font-bold text-brand-brown-muted">{getScanStatusText()}</span>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:flex md:flex-wrap md:justify-end">
              <Button icon={Camera} onClick={handleStartCamera} disabled={isScanning || isSubmitting}>
                Mulai Kamera
              </Button>
              <Button icon={ScanFace} isLoading={isScanning} loadingText="Memindai..." onClick={handleStartScan} variant="secondary" disabled={isSubmitting || isModelLoading}>
                Mulai Scan
              </Button>
              {scanPhase === 'success' ? (
                <Button icon={CheckCircle2} isLoading={isSubmitting} loadingText="Mengirim..." onClick={handleSubmitClick}>
                  Simpan Absensi
                </Button>
              ) : null}
              <Button icon={RefreshCcw} onClick={handleResetScan} variant="ghost" disabled={isScanning || isSubmitting}>
                Ulangi Scan
              </Button>
              <Button as={Link} icon={ArrowLeft} to="/dashboard-pegawai" variant="secondary">
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid content-start gap-4">
          <Card title="Status Pemindaian">
            <div className="grid gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
              <span className="text-[13px] font-extrabold text-brand-brown-muted">Status Deteksi</span>
              <StatusBadge tone={getScanStatusTone()}>{getScanStatusText()}</StatusBadge>
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
                <StatusBadge>{attendanceType}</StatusBadge>
              </div>
              <div className="grid min-h-[78px] content-center gap-2 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-3.5">
                <span className="text-[13px] font-extrabold text-brand-brown-muted">Status Verifikasi</span>
                <StatusBadge tone={getScanStatusTone()}>
                  {scanPhase === 'success' ? 'Terverifikasi' : scanPhase === 'error' ? 'Gagal' : 'Menunggu'}
                </StatusBadge>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Scan result notifications */}
      {scanPhase === 'success' || scanPhase === 'error' ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Area notifikasi absensi">
          {scanPhase === 'success' ? (
            <div className="rounded-[var(--radius-md)] border border-[#f1d37a] bg-[var(--color-success-soft)] p-[18px] shadow-[var(--shadow-subtle)]">
              <strong className="mb-2 inline-flex items-center gap-2 text-base text-brand-brown">
                <CheckCircle2 aria-hidden="true" className="h-[18px] w-[18px] stroke-[2.5]" />
                Berhasil
              </strong>
              <p className="mb-0 text-brand-brown-muted">
                Wajah berhasil terdeteksi. Klik "Simpan Absensi" untuk menyimpan data.
              </p>
            </div>
          ) : null}
          {scanPhase === 'error' ? (
            <div className="rounded-[var(--radius-md)] border border-[#f4b8b0] bg-[var(--color-danger-soft)] p-[18px] shadow-[var(--shadow-subtle)]">
              <strong className="mb-2 inline-flex items-center gap-2 text-base text-brand-brown">
                <XCircle aria-hidden="true" className="h-[18px] w-[18px] stroke-[2.5]" />
                Gagal
              </strong>
              <p className="mb-0 text-brand-brown-muted">{scanError || 'Wajah tidak dikenali atau pegawai tidak terdaftar.'}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Confirm modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Konfirmasi Absensi"
        footer={
          <>
            <Button onClick={handleConfirmSubmit}>Ya, Simpan</Button>
            <Button onClick={() => setShowConfirm(false)} variant="secondary">Batal</Button>
          </>
        }
      >
        <p>
          Simpan <strong>{attendanceType}</strong> untuk{' '}
          <strong>{scanResult?.employeeName || 'pegawai terverifikasi'}</strong>?
        </p>
      </Modal>
    </main>
  )
}

export default AttendancePage
