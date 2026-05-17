import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import absensikuLogo from '../assets/absensiku-logo.png'
import { Button, Card, Input } from '../components/ui'
import { useAuth } from '../contexts'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, user } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If already logged in, redirect to the matching flow.
  if (isAuthenticated && user) {
    const destination = user.role === 'admin' ? '/admin/dashboard' : '/absensi'

    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const result = await login(username, password)
      // Redirect to the originally intended page, or the role-based default
      const from = location.state?.from?.pathname
      const destination = from || result.redirectTo

      navigate(destination, { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-[100svh] grid-cols-1 items-center justify-items-center gap-4 bg-brand-page p-[var(--space-xl)_var(--page-gutter)] md:grid-cols-[minmax(0,0.95fr)_minmax(360px,440px)] md:justify-items-stretch md:gap-12 md:p-[48px_var(--page-gutter-desktop)]">
      <section
        className="grid w-full max-w-[430px] content-center gap-5 self-stretch rounded-[var(--radius-lg)] border border-brand-border bg-brand-white p-5 shadow-[var(--shadow-soft)] sm:p-6 md:min-h-[560px] md:max-w-[720px]"
        aria-label="Informasi AbsensiKu"
      >
        <img
          className="block max-h-[72px] w-full max-w-[240px] object-contain object-left md:max-h-[92px] md:max-w-[320px]"
          src={absensikuLogo}
          alt="AbsensiKu"
        />
        <div className="grid gap-3">
          <h1 className="mb-0 max-w-[680px] text-[clamp(30px,8vw,42px)] leading-tight text-brand-brown md:text-[40px]">
            Login Admin AbsensiKu
          </h1>
          <p className="mb-0 max-w-[620px] text-[15px] text-brand-brown-muted md:text-[17px]">
            Halaman ini khusus admin. Pegawai melakukan absensi langsung dari halaman scan wajah tanpa login.
          </p>
        </div>
      </section>

      <section className="w-full max-w-[430px] md:max-w-[440px]" aria-label="Form login admin">
        <Card
          className="w-full max-w-[430px] border-brand-border-strong md:max-w-[440px]"
          description="Masukkan kredensial admin untuk membuka dashboard pengelolaan."
          title="Login Admin"
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Input
              id="admin-username"
              label="Username Admin"
              onChange={(event) => setUsername(event.target.value)}
              value={username}
              disabled={isSubmitting}
            />
            <Input
              id="admin-password"
              label="Password Admin"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
              disabled={isSubmitting}
            />
            {errorMessage ? (
              <p className="mb-0 rounded-[var(--radius-md)] border border-[#f4b8b0] bg-[var(--color-danger-soft)] px-3 py-2.5 text-sm font-bold text-[var(--color-danger)]">
                {errorMessage}
              </p>
            ) : null}
            <Button
              icon={LogIn}
              isLoading={isSubmitting}
              loadingText="Memeriksa admin..."
              type="submit"
            >
              Masuk sebagai Admin
            </Button>
          </form>
          <div className="mt-4 grid gap-1.5 rounded-[var(--radius-md)] border border-brand-border bg-brand-yellow-soft p-4">
            <strong className="text-[13px] text-brand-brown">Akun demo admin</strong>
            <div className="grid gap-1">
              <span className="text-xs font-semibold leading-snug text-brand-brown-muted">
                Admin: admin / admin
              </span>
            </div>
          </div>
        </Card>
      </section>
    </main>
  )
}

export default LoginPage
