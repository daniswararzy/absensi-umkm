import { NavLink, useNavigate } from 'react-router-dom'
import absensikuLogo from '../../assets/absensiku-logo.png'
import { useAuth } from '../../contexts'
import { navigationItems } from '../../routes/navigation'

function Sidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleNavClick(event, item) {
    // Intercept the "Keluar" nav item to perform logout
    if (item.path === '/login') {
      event.preventDefault()
      logout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <aside
      className="flex w-full max-w-[100vw] min-w-0 flex-col gap-4 overflow-x-hidden border-b border-brand-border bg-brand-white p-[var(--space-md)_var(--page-gutter)] text-brand-brown md:gap-[34px] md:border-b-0 md:border-r md:p-7"
      aria-label="Navigasi admin"
    >
      <div className="flex w-full min-w-0 items-center gap-[14px] border-b border-brand-border bg-transparent pb-4">
        <img
          className="block max-h-14 w-full max-w-[190px] object-contain object-left md:max-h-[62px] md:max-w-[210px]"
          src={absensikuLogo}
          alt="AbsensiKu"
        />
      </div>
      <nav className="flex w-full max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-1 md:overflow-x-visible md:pb-0">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              className={({ isActive }) =>
                [
                  'group grid min-h-[52px] max-w-[calc(100vw-(var(--page-gutter)*2))] shrink-0 basis-[min(172px,calc(100vw-(var(--page-gutter)*2)))] grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-[var(--radius-md)] border p-3 no-underline md:max-w-none md:basis-auto',
                  'text-brand-brown',
                  isActive
                    ? 'border-brand-yellow bg-brand-yellow text-brand-brown'
                    : 'border-transparent hover:border-[#f1dca2] hover:bg-brand-yellow-soft hover:text-brand-brown',
                ].join(' ')
              }
              key={item.path}
              onClick={(event) => handleNavClick(event, item)}
              to={item.path}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-[34px] w-[34px] place-items-center rounded-[var(--radius-sm)] text-brand-brown ${
                      isActive
                        ? 'bg-[rgba(58,36,24,0.12)]'
                        : 'bg-[var(--color-warning-soft)] group-hover:bg-[rgba(58,36,24,0.12)]'
                    }`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-[18px] w-[18px] stroke-[2.4]"
                    />
                  </span>
                  <span className="grid min-w-0 gap-[3px]">
                    <span className="text-[15px] font-extrabold">
                      {item.label}
                    </span>
                    <small
                      className={`hidden text-xs leading-[1.35] md:block ${
                        isActive
                          ? 'text-brand-brown'
                          : 'text-brand-brown-muted group-hover:text-brand-brown'
                      }`}
                    >
                      {item.description}
                    </small>
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
