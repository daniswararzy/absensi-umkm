import { NavLink, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import absensikuLogo from '../../assets/absensiku-logo.png'
import { useAuth } from '../../contexts'
import { navigationItems } from '../../routes/navigation'

const navPastelColors = {
  '/admin/dashboard': 'bg-pastel-yellow',
  '/admin/pegawai': 'bg-pastel-green',
  '/admin/registrasi-wajah': 'bg-pastel-pink',
  '/admin/laporan': 'bg-pastel-purple',
  '/admin/login': 'bg-pastel-red',
}

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleNavClick(event, item) {
    if (item.path === '/admin/login') {
      event.preventDefault()
      logout()
      navigate('/admin/login', { replace: true })
    }
    // Close drawer on mobile after navigating
    onClose?.()
  }

  return (
    <aside
      className={[
        // Base layout
        'flex shrink-0 flex-col gap-4 overflow-y-auto overflow-x-hidden',
        'border-brand-border bg-brand-white text-brand-heading',
        'p-[var(--space-md)_var(--space-md)]',
        // Mobile/tablet: fixed overlay drawer
        'admin-mobile-sidebar fixed inset-y-0 left-0 z-40 w-[280px] shadow-[var(--shadow-soft)]',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static sidebar that can be toggled by the burger button
        isOpen ? 'md:relative md:flex md:h-auto md:translate-x-0' : 'md:hidden',
        'md:z-auto md:w-[280px] md:gap-[34px] md:border-r md:border-b-0 md:p-7 md:shadow-none md:transition-none',
      ].join(' ')}
      aria-label="Navigasi panel admin"
    >
      {/* Header: logo + close button (mobile only) */}
      <div className="admin-sidebar-header flex w-full min-w-0 items-center gap-3 border-b border-brand-border bg-transparent pb-4">
        <img
          className="block max-h-14 w-full max-w-[180px] object-contain object-left md:max-h-[56px] md:max-w-[200px]"
          src={absensikuLogo}
          alt="AbsensiKu"
        />
        {/* Close button — mobile only */}
        <button
          aria-label="Tutup menu"
          className="admin-sidebar-close ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-brand-border bg-brand-surface-muted text-brand-heading transition-colors hover:bg-brand-primary-soft md:hidden"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="h-[18px] w-[18px] stroke-[1.8]" />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Menu utama admin"
        className="flex w-full min-w-0 max-w-full flex-col gap-1.5"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon
          const pastelBg = navPastelColors[item.path] || 'bg-brand-surface-muted'

          return (
            <NavLink
              className={({ isActive }) =>
                [
                  'group grid min-h-[52px] w-full grid-cols-[34px_minmax(0,1fr)] items-center gap-2.5 rounded-[var(--radius-md)] border p-3 no-underline transition-colors duration-150',
                  isActive
                    // Active: yellow background, DARK text (accessibility)
                    ? 'border-brand-primary bg-brand-primary text-brand-heading'
                    // Hover: soft yellow tint, always dark text
                    : 'border-transparent text-brand-heading hover:border-brand-primary-soft hover:bg-brand-primary-soft hover:text-brand-heading',
                ].join(' ')
              }
              key={item.path}
              onClick={(event) => handleNavClick(event, item)}
              to={item.path}
            >
              {({ isActive }) => (
                <>
                  {/* Icon container */}
                  <span
                    className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[var(--radius-sm)] text-brand-heading transition-colors ${
                      isActive
                        ? 'bg-black/10'           // dark overlay on yellow bg
                        : `${pastelBg} group-hover:bg-black/10`
                    }`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-[18px] w-[18px] stroke-[1.8]"
                    />
                  </span>

                  {/* Label */}
                  <span className="grid min-w-0 gap-[3px]">
                    <span className="text-[15px] font-extrabold leading-snug">
                      {item.label}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
