import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-brand-page p-[var(--space-xl)_var(--page-gutter)]">
      <section className="w-[min(520px,100%)] rounded-[var(--radius-md)] border border-brand-border bg-brand-white p-7 shadow-[var(--shadow-soft)]">
        <p className="mb-2 text-xs font-extrabold uppercase text-brand-brown-muted">404</p>
        <h1 className="mb-2.5 text-[28px] text-brand-brown">Halaman tidak ditemukan</h1>
        <p className="text-brand-brown-muted">
          Route yang dibuka belum terdaftar di aplikasi Absensi UMKM.
        </p>
        <Link
          className="mt-2.5 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] bg-brand-yellow px-3.5 py-2 font-extrabold text-brand-brown no-underline"
          to="/dashboard"
        >
          Kembali ke dashboard
        </Link>
      </section>
    </main>
  )
}

export default NotFoundPage
