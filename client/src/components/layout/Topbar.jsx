import { Menu } from 'lucide-react'

function Topbar({ isSidebarOpen, onBurgerClick }) {
  return (
    <header className="flex min-h-[64px] w-full min-w-0 max-w-full items-center overflow-hidden border-b border-brand-border bg-brand-white px-[var(--page-gutter)] py-3 shadow-[0_1px_0_rgba(17,24,39,0.04)] md:px-8 md:py-[18px]">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label={isSidebarOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={isSidebarOpen}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] border border-brand-border bg-brand-surface-muted text-brand-heading transition-colors hover:border-brand-primary hover:bg-brand-primary-soft"
          onClick={onBurgerClick}
          type="button"
        >
          <Menu aria-hidden="true" className="h-5 w-5 stroke-[1.8]" />
        </button>
      </div>
    </header>
  )
}

export default Topbar
