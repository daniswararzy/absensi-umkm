import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { MainLayout, ProtectedRoute } from '../components/layout'
import { PageLoader } from '../components/ui'

const AttendancePage = lazy(() => import('../pages/AttendancePage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const EmployeesPage = lazy(() => import('../pages/EmployeesPage'))
const EmployeeFormPage = lazy(() => import('../pages/EmployeeFormPage'))
const FaceRegistrationPage = lazy(() => import('../pages/FaceRegistrationPage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const ReportsPage = lazy(() => import('../pages/ReportsPage'))

function LegacyEmployeeEditRedirect() {
  const { employeeId } = useParams()

  return <Navigate to={`/admin/pegawai/${employeeId}/edit`} replace />
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public employee flow: open attendance directly, without login. */}
          <Route index element={<Navigate to="/absensi" replace />} />
          <Route path="absensi" element={<AttendancePage />} />
          {/* Legacy employee dashboard route kept as a safe redirect. */}
          <Route path="dashboard-pegawai" element={<Navigate to="/absensi" replace />} />

          {/* Public admin login + legacy admin redirects. */}
          <Route path="admin/login" element={<LoginPage />} />
          <Route path="login" element={<Navigate to="/admin/login" replace />} />
          <Route path="dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="pegawai" element={<Navigate to="/admin/pegawai" replace />} />
          <Route path="pegawai/tambah" element={<Navigate to="/admin/pegawai/tambah" replace />} />
          <Route path="pegawai/:employeeId/edit" element={<LegacyEmployeeEditRedirect />} />
          <Route path="karyawan" element={<Navigate to="/admin/pegawai" replace />} />
          <Route path="registrasi-wajah" element={<Navigate to="/admin/registrasi-wajah" replace />} />
          <Route path="laporan" element={<Navigate to="/admin/laporan" replace />} />

          {/* Admin routes — requires admin auth */}
          <Route element={<ProtectedRoute />}>
            <Route path="admin" element={<MainLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="pegawai" element={<EmployeesPage />} />
              <Route path="pegawai/tambah" element={<EmployeeFormPage />} />
              <Route path="pegawai/:employeeId/edit" element={<EmployeeFormPage />} />
              <Route path="karyawan" element={<Navigate to="/admin/pegawai" replace />} />
              <Route path="registrasi-wajah" element={<FaceRegistrationPage />} />
              <Route path="laporan" element={<ReportsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRoutes
