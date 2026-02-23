import { useSelector } from 'react-redux'
import { hasPermission, canViewRole, isRoleHigherOrEqual } from '../../constants/roles'

/**
 * Check permission using settings first, falling back to hardcoded PERMISSIONS.
 */
const checkSettingsPermission = (settingsPermissions, userRole, resource, action) => {
  const rolesArray = settingsPermissions?.[resource]?.[action]
  if (rolesArray) {
    return rolesArray.includes(userRole)
  }
  // Fallback to hardcoded
  return hasPermission(userRole, resource, action)
}

/**
 * Permission Gate Component
 * Conditionally renders children based on user permissions
 *
 * Usage:
 * <PermissionGate resource="checkups" action="edit">
 *   <Button>Edit</Button>
 * </PermissionGate>
 */
export const PermissionGate = ({
  children,
  resource,
  action,
  fallback = null,
  requiredRole = null,
  targetRole = null, // For viewing specific roles
}) => {
  const user = useSelector((state) => state.auth.user)
  const settingsPermissions = useSelector((state) => state.settings.data?.permissions)

  if (!user || !user.role) {
    return fallback
  }

  // Check if user has required role level
  if (requiredRole && !isRoleHigherOrEqual(user.role, requiredRole)) {
    return fallback
  }

  // Check if user can view specific target role
  if (targetRole && !canViewRole(user.role, targetRole)) {
    return fallback
  }

  // Check if user has permission for resource and action
  if (resource && action) {
    if (!checkSettingsPermission(settingsPermissions, user.role, resource, action)) {
      return fallback
    }
  }

  return children
}

/**
 * Hook to check permissions programmatically
 */
export const usePermission = () => {
  const user = useSelector((state) => state.auth.user)
  const settingsPermissions = useSelector((state) => state.settings.data?.permissions)

  const checkPermission = (resource, action) => {
    if (!user || !user.role) return false
    return checkSettingsPermission(settingsPermissions, user.role, resource, action)
  }

  const checkRole = (requiredRole) => {
    if (!user || !user.role) return false
    return isRoleHigherOrEqual(user.role, requiredRole)
  }

  const checkViewRole = (targetRole) => {
    if (!user || !user.role) return false
    return canViewRole(user.role, targetRole)
  }

  return {
    checkPermission,
    checkRole,
    checkViewRole,
    userRole: user?.role,
    user,
  }
}

export default PermissionGate
