import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useSettings } from '../hooks/useSettings'
import LoadingSpinner from './common/LoadingSpinner'

// Map first path segment to page settings key
function getPageKey(pathname) {
  const segment = pathname.split('/').filter(Boolean)[0]
  return segment || null
}

function ProtectedRoute({ children, adminOnly = false, roles = [] }) {
  const { isAuthenticated, user, authChecked } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const location = useLocation()

  // Wait for initial auth check to complete
  if (!authChecked) {
    return <LoadingSpinner text="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Superadmin always gets access (safety net)
  if (user?.role !== 'superadmin') {
    // Check dynamic page access settings
    const pageKey = getPageKey(location.pathname)
    const pageRoles = pageKey ? settings?.pages?.[pageKey]?.roles : null

    if (pageRoles) {
      if (!pageRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />
      }
    } else {
      // Fallback to prop-based checks when no settings match
      if (roles.length > 0 && !roles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />
      }

      if (adminOnly && !['admin', 'superadmin', 'maintainer'].includes(user?.role)) {
        return <Navigate to="/dashboard" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute
