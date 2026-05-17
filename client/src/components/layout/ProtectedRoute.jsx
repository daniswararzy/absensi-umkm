import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts'
import { PageLoader } from '../ui'

/**
 * ProtectedRoute — guards admin routes based on auth state.
 *
 * Behaviour:
 *   - While session is being restored, shows a loading spinner.
 *   - If user is not authenticated, redirects to /admin/login and preserves the
 *     originally intended admin route in location state.
 *   - If the authenticated user is not admin, redirects to /absensi.
 */
function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Still restoring session — show loader to prevent redirect flash
  if (isLoading) {
    return <PageLoader message="Memeriksa sesi..." />
  }

  // Not logged in → redirect to login, preserve the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Admin routes are only relevant for admin users.
  if (user?.role !== 'admin') {
    return <Navigate to="/absensi" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
