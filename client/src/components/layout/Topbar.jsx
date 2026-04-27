import StatusBadge from '../ui/StatusBadge'

function Topbar() {
  return (
    <header className="admin-topbar">
      <div>
        <p className="eyebrow">Admin Panel</p>
        <strong>Sistem Absensi Pegawai</strong>
      </div>
      <div className="topbar-actions">
        <StatusBadge tone="info">Prototype</StatusBadge>
      </div>
    </header>
  )
}

export default Topbar
