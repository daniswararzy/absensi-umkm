import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts'
import { PageLoader } from '../ui'

/**
 * ProtectedRoute — guards child routes based on auth state.
 *
 * Props:
 *   - allowedRoles : string[] (optional) — if provided, only users whose
 *     role is in this list may access the route. Others are redirected
 *     to their default dashboard.
 *
 * Behaviour:
 *   - While session is being restored (isLoading), shows a loading spinner
 *     to avoid an unwanted redirect flash.
 *   - If user is not authenticated, redirects to /login and preserves the
 *     originally intended destination in location state.
 *   - If user's role is not in allowedRoles, redirects to:
 *       admin   → /dashboard
 *       pegawai → /dashboard-pegawai
 */
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Still restoring session — show loader to prevent redirect flash
  if (isLoading) {
    return <PageLoader message="Memeriksa sesi..." />
  }

  // Not logged in → redirect to login, preserve the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role check (if specified)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'admin' ? '/dashboard' : '/dashboard-pegawai'

    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
