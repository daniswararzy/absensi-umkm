import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../components/layout'
import AttendancePage from '../pages/AttendancePage'
import DashboardPage from '../pages/DashboardPage'
import EmployeeDashboardPage from '../pages/EmployeeDashboardPage'
import EmployeesPage from '../pages/EmployeesPage'
import EmployeeFormPage from '../pages/EmployeeFormPage'
import FaceRegistrationPage from '../pages/FaceRegistrationPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ReportsPage from '../pages/ReportsPage'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="dashboard-pegawai" element={<EmployeeDashboardPage />} />
        <Route path="absensi" element={<AttendancePage />} />
        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pegawai" element={<EmployeesPage />} />
          <Route path="pegawai/tambah" element={<EmployeeFormPage />} />
          <Route path="pegawai/:employeeId/edit" element={<EmployeeFormPage />} />
          <Route path="karyawan" element={<Navigate to="/pegawai" replace />} />
          <Route path="registrasi-wajah" element={<FaceRegistrationPage />} />
          <Route path="laporan" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
