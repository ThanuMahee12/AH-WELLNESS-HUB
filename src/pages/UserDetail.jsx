import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap'
import { FaUsers, FaArrowLeft, FaKey, FaBan, FaCheckCircle } from 'react-icons/fa'
import { fetchUsers, updateUser, deleteUser, toggleUserStatus, selectAllUsers } from '../store/usersSlice'
import { registerUser } from '../store/authSlice'
import { authService } from '../services/authService'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'
import { useForm } from '../hooks'
import { useNotification } from '../context'
import { EntityForm } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'

const USER_FIELDS = [
  { name: 'username', label: 'Username', type: 'text', required: true, colSize: 6 },
  { name: 'email', label: 'Email', type: 'email', required: true, colSize: 6 },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, colSize: 6 },
  { name: 'role', label: 'Role', type: 'select', required: true, colSize: 6, options: [
    { value: 'user', label: 'User' },
    { value: 'editor', label: 'Editor' },
    { value: 'maintainer', label: 'Maintainer' },
    { value: 'admin', label: 'Admin' },
    { value: 'superadmin', label: 'Superadmin' },
  ]},
];

const INITIAL_FORM = {
  username: '',
  email: '',
  mobile: '',
  role: 'user',
  password: '',
};

function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const users = useSelector(selectAllUsers)
  const { loading } = useSelector(state => state.users)
  const { user: currentUser } = useSelector(state => state.auth)
  const { success, error: showError } = useNotification()
  const { checkPermission } = usePermission()
  const [resettingPassword, setResettingPassword] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)

  const isNew = id === 'new'
  const user = isNew ? null : users.find(u => u.id === id)

  // Only show password field for new users; editing uses reset email instead
  const fields = useMemo(() => {
    if (isNew) {
      return [
        ...USER_FIELDS,
        { name: 'password', label: 'Password', type: 'password', required: true, colSize: 6 },
      ]
    }
    return USER_FIELDS
  }, [isNew])

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      if (isNew) {
        const result = await dispatch(registerUser(formData))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to create user')
        }
        await dispatch(fetchUsers())
        success('User created successfully!')
        navigate(`/users/${result.payload.uid}`, { replace: true })
      } else {
        const { password, ...dataToSubmit } = formData
        const result = await dispatch(updateUser({ id, ...dataToSubmit }))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to update user')
        }
        success('User updated successfully!')
      }
    } catch (err) {
      showError(err.message || 'Operation failed')
      throw err
    }
  }, [isNew, id, dispatch, navigate, success, showError])

  const form = useForm(INITIAL_FORM, handleFormSubmit)

  // Load user data into form when editing
  useEffect(() => {
    if (user) {
      form.resetTo({
        username: user.username || '',
        email: user.email || '',
        mobile: user.mobile || '',
        role: user.role || 'user',
        password: '',
      })
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch users if store is empty
  useEffect(() => {
    if (users.length === 0) {
      dispatch(fetchUsers())
    }
  }, [dispatch, users.length])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      const result = await dispatch(deleteUser(id))
      if (result.type.includes('rejected')) {
        throw new Error(result.payload || 'Failed to delete user')
      }
      success('User deleted successfully!')
      navigate('/users')
    } catch (err) {
      showError(err.message || 'Delete failed')
    }
  }

  const handleResetPassword = async () => {
    const email = user?.email
    if (!email) {
      showError('User email not found')
      return
    }
    if (!window.confirm(`Send password reset email to ${email}?`)) return

    setResettingPassword(true)
    try {
      const result = await authService.resetPassword(email)
      if (result.success) {
        // Log password reset activity
        if (currentUser) {
          await logActivity({
            userId: currentUser.uid,
            username: currentUser.username || currentUser.email,
            userRole: currentUser.role,
            activityType: ACTIVITY_TYPES.USER_PASSWORD_RESET,
            description: createActivityDescription(ACTIVITY_TYPES.USER_PASSWORD_RESET, {
              username: user.username
            }),
            metadata: {
              targetUserId: id,
              targetUsername: user.username,
              targetEmail: email,
            }
          })
        }
        success(`Password reset email sent to ${email}`)
      } else {
        throw new Error(result.error || 'Failed to send reset email')
      }
    } catch (err) {
      showError(err.message || 'Failed to send reset email')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleToggleStatus = async () => {
    const action = user.disabled ? 'enable' : 'disable'
    if (!window.confirm(`Are you sure you want to ${action} this user account?`)) return

    setTogglingStatus(true)
    try {
      const result = await dispatch(toggleUserStatus({ id, disabled: !!user.disabled }))
      if (result.type.includes('rejected')) {
        throw new Error(result.payload || `Failed to ${action} user`)
      }
      success(`User account ${action}d successfully!`)
    } catch (err) {
      showError(err.message || `Failed to ${action} user`)
    } finally {
      setTogglingStatus(false)
    }
  }

  // Not found
  if (!isNew && !user && users.length > 0) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>User not found</h4>
            <Button
              onClick={() => navigate('/users')}
              className="btn-theme"
            >
              <FaArrowLeft className="me-2" />
              Back to Users
            </Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const canEdit = checkPermission('users', isNew ? 'create' : 'edit')
  const canDelete = !isNew && checkPermission('users', 'delete')

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fs-responsive-lg">
            <FaUsers className="me-2 text-theme" />
            {isNew ? 'Add New User' : 'User Details'}
          </h2>
        </Col>
      </Row>

      <Row>
        <Col>
          <EntityForm
            title={isNew ? 'New User Information' : `Edit User: ${user?.username || ''}`}
            fields={fields}
            formData={form.formData}
            formErrors={form.errors}
            onFormChange={form.handleChange}
            onSubmit={form.handleSubmit}
            onCancel={() => navigate('/users')}
            onDelete={canDelete ? handleDelete : undefined}
            loading={form.isSubmitting || loading}
            isEditing={!isNew}
          />
        </Col>
      </Row>

      {!isNew && user && (
        <Row className="mt-3">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="card-header-theme">
                <h5 className="mb-0 fs-responsive-md">Password Management</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  Send a password reset link to the user's email address ({user.email}).
                </p>
                <Button
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  variant="outline-warning"
                >
                  {resettingPassword ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaKey className="me-2" />
                      Send Password Reset Email
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {!isNew && user && currentUser?.role === 'superadmin' && user.id !== currentUser.uid && (
        <Row className="mt-3">
          <Col>
            <Card className="shadow-sm" style={{ borderLeft: `4px solid ${user.disabled ? '#198754' : '#dc3545'}` }}>
              <Card.Header className="card-header-theme">
                <h5 className="mb-0 fs-responsive-md">Account Status</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  This account is currently{' '}
                  <strong style={{ color: user.disabled ? '#dc3545' : '#198754' }}>
                    {user.disabled ? 'Disabled' : 'Active'}
                  </strong>.
                  {user.disabled
                    ? ' The user cannot log in. Enable to restore access.'
                    : ' The user can log in normally. Disable to revoke access.'}
                </p>
                <Button
                  onClick={handleToggleStatus}
                  disabled={togglingStatus}
                  variant={user.disabled ? 'success' : 'danger'}
                >
                  {togglingStatus ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {user.disabled ? 'Enabling...' : 'Disabling...'}
                    </>
                  ) : (
                    <>
                      {user.disabled ? <FaCheckCircle className="me-2" /> : <FaBan className="me-2" />}
                      {user.disabled ? 'Enable Account' : 'Disable Account'}
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default UserDetail
