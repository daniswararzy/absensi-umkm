import StatusBadge from '../ui/StatusBadge'

function Topbar() {
  return (
    <header className="grid min-h-[72px] w-full min-w-0 max-w-full gap-3 overflow-hidden border-b border-brand-border bg-brand-white p-[var(--space-md)_var(--page-gutter)] shadow-[0_1px_0_rgba(58,36,24,0.04)] md:flex md:min-h-0 md:items-center md:justify-between md:gap-8 md:p-[18px_32px]">
      <div className="min-w-0">
        <p className="mb-2 text-xs font-extrabold uppercase text-brand-brown-muted">
          Admin Panel
        </p>
        <strong className="block text-lg text-brand-brown">
          Sistem Absensi Pegawai
        </strong>
      </div>
      <div className="flex min-w-0 max-w-full flex-wrap items-center justify-start gap-2 md:justify-end">
        <StatusBadge tone="info">Prototype</StatusBadge>
      </div>
    </header>
  )
}

export default Topbar
