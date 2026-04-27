import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <section>
        <p className="eyebrow">404</p>
        <h1>Halaman tidak ditemukan</h1>
        <p>Route yang dibuka belum terdaftar di aplikasi Absensi UMKM.</p>
        <Link to="/dashboard">Kembali ke dashboard</Link>
      </section>
    </main>
  )
}

export default NotFoundPage
