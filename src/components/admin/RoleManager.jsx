import { useState } from 'react'
import { Card, Form, Button, Alert, Badge } from 'react-bootstrap'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { ROLES } from '../../constants/roles'
import { useSelector } from 'react-redux'
import { usePermission } from '../auth/PermissionGate'

/**
 * Role Manager Component
 * SuperAdmin utility to change user roles
 */
const RoleManager = ({ userId, currentRole, username, onRoleChanged }) => {
  const { userRole } = usePermission()
  const currentUser = useSelector((state) => state.auth.user)
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Only SuperAdmin can use this component
  if (userRole !== ROLES.SUPERADMIN) {
    return null
  }

  const roleOptions = [
    { value: ROLES.USER, label: 'User', color: 'secondary', description: 'View only access' },
    { value: ROLES.EDITOR, label: 'Editor', color: 'info', description: 'Can edit with approval' },
    { value: ROLES.MAINTAINER, label: 'Maintainer', color: 'warning', description: 'User management + approvals' },
    { value: ROLES.SUPERADMIN, label: 'SuperAdmin', color: 'danger', description: 'Full system control' },
  ]

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      setMessage({ type: 'info', text: 'No changes to save' })
      return
    }

    // Confirm if downgrading from SuperAdmin
    if (currentRole === ROLES.SUPERADMIN && selectedRole !== ROLES.SUPERADMIN) {
      if (!window.confirm(`⚠️ Warning: You are about to remove SuperAdmin privileges from ${username}. This cannot be undone easily. Continue?`)) {
        return
      }
    }

    // Prevent self-demotion
    if (userId === currentUser.uid && selectedRole !== ROLES.SUPERADMIN) {
      setMessage({ type: 'danger', text: '❌ You cannot remove your own SuperAdmin privileges!' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Update user role in Firestore
      await updateDoc(doc(db, 'users', userId), {
        role: selectedRole,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: currentUser.uid,
        lastModifiedByName: currentUser.username,
      })

      setMessage({
        type: 'success',
        text: `✅ Successfully updated ${username}'s role to ${roleOptions.find(r => r.value === selectedRole)?.label}`
      })

      // Callback to parent component
      if (onRoleChanged) {
        onRoleChanged(userId, selectedRole)
      }

    } catch (error) {
      setMessage({
        type: 'danger',
        text: `❌ Failed to update role: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentRoleBadge = (role) => {
    const roleInfo = roleOptions.find(r => r.value === role)
    return roleInfo ? (
      <Badge bg={roleInfo.color}>{roleInfo.label}</Badge>
    ) : (
      <Badge bg="secondary">{role}</Badge>
    )
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-danger text-white">
        <strong>🔐 Role Manager (SuperAdmin Only)</strong>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>User:</strong> {username}
        </div>
        <div className="mb-3">
          <strong>Current Role:</strong> {getCurrentRoleBadge(currentRole)}
        </div>

        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Change Role To:</Form.Label>
          <Form.Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={loading}
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label} - {role.description}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <div className="d-grid gap-2">
          <Button
            variant="danger"
            onClick={handleRoleChange}
            disabled={loading || selectedRole === currentRole}
          >
            {loading ? 'Updating...' : 'Update Role'}
          </Button>
        </div>

        <div className="mt-3">
          <small className="text-muted">
            <strong>⚠️ Warning:</strong> Changing roles will take effect immediately for this user.
            They may need to logout and login again to see all changes.
          </small>
        </div>
      </Card.Body>
    </Card>
  )
}

export default RoleManager
