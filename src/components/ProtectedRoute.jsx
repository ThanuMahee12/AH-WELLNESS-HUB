import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function ProtectedRoute({ children, adminOnly = false, roles = [] }) {
  const { isAuthenticated, user } = useSelector(state => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check for specific roles if provided
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // Legacy adminOnly support (checks for admin, superadmin, maintainer)
  if (adminOnly && !['admin', 'superadmin', 'maintainer'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
