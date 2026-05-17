import { LogIn, ScanFace, ShieldCheck, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import absensikuLogo from '../assets/absensiku-logo.png'
import { Button, Card } from '../components/ui'

function LandingPage() {
  return (
    <main className="grid min-h-[100svh] grid-cols-1 items-center justify-items-center gap-4 bg-brand-page p-[var(--space-xl)_var(--page-gutter)] md:grid-cols-[minmax(0,0.95fr)_minmax(360px,460px)] md:justify-items-stretch md:gap-12 md:p-[48px_var(--page-gutter-desktop)]">
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
            Sistem Absensi Pegawai
          </h1>
          <p className="mb-0 max-w-[620px] text-[15px] text-brand-brown-muted md:text-[17px]">
            Admin masuk untuk mengelola sistem. Pegawai langsung melakukan absensi wajah tanpa login.
          </p>
        </div>
      </section>

      <section className="w-full max-w-[430px] md:max-w-[460px]" aria-label="Pilihan akses">
        <Card
          className="w-full border-brand-border-strong"
          description="Pilih jalur sesuai peran pengguna."
          title="Pilih Jalur Akses"
        >
          <div className="grid gap-3">
            <article className="grid gap-3 rounded-[var(--radius-md)] border border-brand-border bg-brand-page p-4">
              <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-3">
                <span className="grid h-[42px] w-[42px] place-items-center rounded-[var(--radius-md)] bg-brand-yellow text-brand-brown shadow-[var(--shadow-subtle)]">
                  <ShieldCheck aria-hidden="true" className="h-[21px] w-[21px] stroke-[2.4]" />
                </span>
                <div className="min-w-0">
                  <h2 className="mb-1 text-[20px] leading-tight text-brand-brown">Login Admin</h2>
                  <p className="mb-0 text-sm font-semibold leading-relaxed text-brand-brown-muted">
                    Gunakan username dan password admin untuk membuka dashboard pengelolaan.
                  </p>
                </div>
              </div>
              <Button as={Link} icon={LogIn} to="/admin/login">
                Masuk sebagai Admin
              </Button>
            </article>

            <article className="grid gap-3 rounded-[var(--radius-md)] border border-[#f1d37a] bg-brand-yellow-soft p-4">
              <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-3">
                <span className="grid h-[42px] w-[42px] place-items-center rounded-[var(--radius-md)] bg-brand-white text-brand-brown shadow-[var(--shadow-subtle)]">
                  <UserCheck aria-hidden="true" className="h-[21px] w-[21px] stroke-[2.4]" />
                </span>
                <div className="min-w-0">
                  <h2 className="mb-1 text-[20px] leading-tight text-brand-brown">Absensi Pegawai</h2>
                  <p className="mb-0 text-sm font-semibold leading-relaxed text-brand-brown-muted">
                    Langsung buka halaman scan wajah. Pegawai tidak perlu username dan password.
                  </p>
                </div>
              </div>
              <Button as={Link} icon={ScanFace} to="/absensi">
                Mulai Absensi Pegawai
              </Button>
            </article>
          </div>
        </Card>
      </section>
    </main>
  )
}

export default LandingPage
