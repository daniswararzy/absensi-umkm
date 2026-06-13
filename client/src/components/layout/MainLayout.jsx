import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function MainLayout() {
  // Open by default on desktop (≥900px), closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 900,
  )

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <main className="flex min-h-[100svh] w-full max-w-[100vw] overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Backdrop — mobile/tablet only, tap to close drawer */}
      {isSidebarOpen && (
        <div
          aria-hidden="true"
          className="admin-sidebar-backdrop fixed inset-0 z-30 bg-[rgba(17,24,39,0.45)] backdrop-blur-[2px] md:hidden"
          onClick={closeSidebar}
        />
      )}

      <section className="flex min-w-0 flex-1 flex-col overflow-x-hidden bg-brand-page">
        <Topbar isSidebarOpen={isSidebarOpen} onBurgerClick={toggleSidebar} />
        <div className="box-border grid w-full min-w-0 max-w-full content-start gap-5 overflow-x-hidden px-[var(--page-gutter)] py-[var(--space-lg)] md:gap-6 md:px-[var(--page-gutter-tablet)] md:py-7 lg:px-[var(--page-gutter-desktop)] lg:py-8">
          <Outlet />
        </div>
      </section>
    </main>
  )
}

export default MainLayout
