import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function MainLayout() {
  return (
    <main className="admin-shell">
      <Sidebar />

      <section className="admin-workspace">
        <Topbar />

        <div className="admin-content">
          <Outlet />
        </div>
      </section>
    </main>
  )
}

export default MainLayout
