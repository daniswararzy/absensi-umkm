import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function MainLayout() {
  return (
    <main
      className="grid min-h-[100svh] w-full max-w-[100vw] grid-cols-1 overflow-x-hidden md:grid-cols-[280px_minmax(0,1fr)]"
    >
      <Sidebar />
      <section className="grid min-w-0 max-w-full overflow-x-hidden grid-rows-[auto_1fr] bg-brand-page">
        <Topbar />
        <div className="box-border grid w-full min-w-0 max-w-full content-start gap-5 overflow-x-hidden px-[var(--page-gutter)] py-[var(--space-lg)] md:gap-6 md:px-[var(--page-gutter-tablet)] md:py-7 lg:px-[var(--page-gutter-desktop)] lg:py-8">
          <Outlet />
        </div>
      </section>
    </main>
  )
}

export default MainLayout
