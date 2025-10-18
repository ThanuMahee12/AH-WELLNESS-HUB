/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * Role Hierarchy (lowest to highest):
 * 1. user - View only access
 * 2. editor - Can edit but needs approval
 * 3. maintainer - User management + approval authority
 * 4. superadmin - Full control
 */

// Role Constants
export const ROLES = {
  USER: 'user',
  EDITOR: 'editor',
  MAINTAINER: 'maintainer',
  SUPERADMIN: 'superadmin',
}

// Role Hierarchy (for comparison)
export const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.EDITOR]: 2,
  [ROLES.MAINTAINER]: 3,
  [ROLES.SUPERADMIN]: 4,
}

// Permissions by Role
export const PERMISSIONS = {
  // User permissions - View only
  [ROLES.USER]: {
    checkups: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      generatePDF: true,
    },
    tests: {
      view: true,
      create: false,
      edit: false,
      delete: false,
    },
    patients: {
      view: true,
      create: false,
      edit: false,
      delete: false,
    },
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      viewOwn: true, // Can view own profile
    },
    approvals: {
      view: false,
      approve: false,
    },
  },

  // Editor permissions - Can edit but needs approval
  [ROLES.EDITOR]: {
    checkups: {
      view: true,
      create: true,
      edit: true, // Creates edit request
      delete: false,
      generatePDF: true,
    },
    tests: {
      view: true,
      create: true,
      edit: true, // Creates edit request
      delete: false,
    },
    patients: {
      view: true,
      create: true,
      edit: true,
      delete: false,
    },
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      viewOwn: true,
    },
    approvals: {
      view: true, // Can view their own edit requests
      approve: false,
    },
  },

  // Maintainer permissions - User management + approval
  [ROLES.MAINTAINER]: {
    checkups: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      generatePDF: true,
    },
    tests: {
      view: true,
      create: true,
      edit: true,
      delete: true,
    },
    patients: {
      view: true,
      create: true,
      edit: true,
      delete: true,
    },
    users: {
      view: true, // Can see users, editors, other maintainers
      create: true, // Request to add user
      edit: true, // Request to edit user
      delete: true, // Request to remove user
      viewOwn: true,
      resetPassword: true, // Can initiate password reset
      viewRoles: [ROLES.USER, ROLES.EDITOR, ROLES.MAINTAINER], // Can view these roles
    },
    approvals: {
      view: true,
      approve: true, // Can approve editor edit requests
      approveUsers: false, // Cannot approve user management requests
    },
  },

  // SuperAdmin permissions - Full control
  [ROLES.SUPERADMIN]: {
    checkups: {
      view: true,
      create: true,
      edit: true, // Direct edit without approval
      delete: true,
      generatePDF: true,
    },
    tests: {
      view: true,
      create: true,
      edit: true, // Direct edit
      delete: true,
    },
    patients: {
      view: true,
      create: true,
      edit: true,
      delete: true,
    },
    users: {
      view: true,
      create: true, // Direct create
      edit: true, // Direct edit
      delete: true,
      viewOwn: true,
      resetPassword: true,
      changePermissions: true, // Can change user roles
      viewRoles: [ROLES.USER, ROLES.EDITOR, ROLES.MAINTAINER, ROLES.SUPERADMIN],
      viewUserId: true, // Only superadmin can see user IDs
    },
    approvals: {
      view: true,
      approve: true, // Can approve all requests
      approveUsers: true, // Can approve user management requests
    },
  },
}

// Edit Request Status
export const EDIT_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// Edit Request Types
export const EDIT_REQUEST_TYPES = {
  CHECKUP_EDIT: 'checkup_edit',
  TEST_EDIT: 'test_edit',
  USER_CREATE: 'user_create',
  USER_EDIT: 'user_edit',
  USER_DELETE: 'user_delete',
}

/**
 * Check if user has specific permission
 * @param {string} userRole - User's role
 * @param {string} resource - Resource type (checkups, tests, patients, users)
 * @param {string} action - Action to perform (view, create, edit, delete)
 * @returns {boolean}
 */
export const hasPermission = (userRole, resource, action) => {
  if (!userRole || !PERMISSIONS[userRole]) return false
  const resourcePermissions = PERMISSIONS[userRole][resource]
  if (!resourcePermissions) return false
  return resourcePermissions[action] === true
}

/**
 * Check if user role is higher than or equal to target role
 * @param {string} userRole - Current user's role
 * @param {string} targetRole - Target role to compare
 * @returns {boolean}
 */
export const isRoleHigherOrEqual = (userRole, targetRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole]
}

/**
 * Check if user can view specific role's details
 * @param {string} userRole - Current user's role
 * @param {string} targetRole - Target user's role to view
 * @returns {boolean}
 */
export const canViewRole = (userRole, targetRole) => {
  const viewRoles = PERMISSIONS[userRole]?.users?.viewRoles || []
  return viewRoles.includes(targetRole)
}

/**
 * Check if action needs approval
 * @param {string} userRole - User's role
 * @param {string} resource - Resource type
 * @param {string} action - Action type
 * @returns {boolean}
 */
export const needsApproval = (userRole, resource, action) => {
  // Editors need approval for edits on checkups and tests
  if (userRole === ROLES.EDITOR && action === 'edit' && (resource === 'checkups' || resource === 'tests')) {
    return true
  }
  // Maintainers need approval for user management
  if (userRole === ROLES.MAINTAINER && resource === 'users' && ['create', 'edit', 'delete'].includes(action)) {
    return true
  }
  return false
}
