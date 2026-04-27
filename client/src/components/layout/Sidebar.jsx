import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../routes/navigation'

function Sidebar() {
  return (
    <aside className="admin-sidebar" aria-label="Navigasi admin">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          A
        </div>
        <div>
          <p className="eyebrow sidebar-eyebrow">Proyek PI</p>
          <h1>Absensi UMKM</h1>
        </div>
      </div>

      <nav className="admin-nav">
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              isActive ? 'admin-nav-link active' : 'admin-nav-link'
            }
            key={item.path}
            to={item.path}
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
