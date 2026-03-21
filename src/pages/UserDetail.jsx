import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button, Spinner, Form, Badge } from 'react-bootstrap'
import { FaUsers, FaKey, FaBan, FaCheckCircle, FaLink, FaUnlink, FaMagic } from 'react-icons/fa'
import { Breadcrumb } from '../components/ui'
import { fetchUsers, updateUser, deleteUser, toggleUserStatus, selectAllUsers, linkPatient, unlinkPatient, autoLinkByMobile } from '../store/usersSlice'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { registerUser } from '../store/authSlice'
import { authService } from '../services/authService'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'
import { useForm, useSettings } from '../hooks'
import { useNotification } from '../context'
import { EntityForm } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'

function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const users = useSelector(selectAllUsers)
  const { loading } = useSelector(state => state.users)
  const { user: currentUser } = useSelector(state => state.auth)
  const { success, error: showError, confirm } = useNotification()
  const { checkPermission } = usePermission()
  const { getEntityFields, getInitialFormData } = useSettings()
  const patients = useSelector(selectAllPatients)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [linking, setLinking] = useState(false)

  const isNew = id === 'new'
  const user = isNew ? null : users.find(u => u.id === id)

  // Get fields from settings, inject role options, add password for new users
  const fields = useMemo(() => {
    const entityFields = getEntityFields('users')
    if (isNew) {
      return [
        ...entityFields,
        { name: 'password', label: 'Password', type: 'password', required: true, colSize: 6 },
      ]
    }
    return entityFields
  }, [isNew, getEntityFields])

  const INITIAL_FORM = useMemo(() =>
    getInitialFormData('users', { role: 'user', password: '' }),
    [getInitialFormData]
  )

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
      const resetData = { ...INITIAL_FORM }
      Object.keys(resetData).forEach(key => {
        if (user[key] != null) resetData[key] = String(user[key])
      })
      resetData.password = ''
      resetData.role = user.role || 'user'
      form.resetTo(resetData)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch users and patients if store is empty
  useEffect(() => {
    if (users.length === 0) dispatch(fetchUsers())
    if (patients.length === 0) dispatch(fetchPatients())
  }, [dispatch, users.length, patients.length])

  const handleDelete = async () => {
    if (!(await confirm('Are you sure you want to delete this user?'))) return
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
    if (!(await confirm(`Send password reset email to ${email}?`, { title: 'Reset Password', variant: 'warning', confirmText: 'Send' }))) return

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
    if (!(await confirm(`Are you sure you want to ${action} this user account?`, { title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`, variant: 'warning' }))) return

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
        <Breadcrumb
          items={[{ label: 'Users', path: '/users' }]}
          current="Not Found"
        />
        <Card>
          <Card.Body className="text-center py-5">
            <h4>User not found</h4>
            <p className="text-muted">The user you're looking for doesn't exist or has been removed.</p>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const canEdit = checkPermission('users', isNew ? 'create' : 'edit')
  const canDelete = !isNew && checkPermission('users', 'delete')

  return (
    <Container fluid className="p-3 p-md-4">
      <Breadcrumb
        items={[{ label: 'Users', path: '/users' }]}
        current={isNew ? 'New User' : (user?.username || 'User Details')}
      />

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
      {!isNew && user && checkPermission('users', 'edit') && (() => {
        const linkedIds = user.linkedPatients || []
        const linkedList = patients.filter(p => linkedIds.includes(p.id))
        const availablePatients = patients.filter(p => !p.linkedUserId && !linkedIds.includes(p.id))

        const handleLink = async () => {
          if (!selectedPatientId) return
          setLinking(true)
          try {
            const patient = patients.find(p => p.id === selectedPatientId)
            const result = await dispatch(linkPatient({ userId: id, patientId: selectedPatientId, patientName: patient?.name, targetUsername: user.username }))
            if (result.type.includes('rejected')) throw new Error(result.payload)
            success(`Linked ${patient?.name || 'patient'} to ${user.username}`)
            setSelectedPatientId('')
          } catch (err) { showError(err.message || 'Failed to link patient') }
          finally { setLinking(false) }
        }

        const handleUnlink = async (patientId) => {
          const patient = patients.find(p => p.id === patientId)
          if (!(await confirm(`Unlink ${patient?.name || 'this patient'} from ${user.username}?`, { title: 'Unlink Patient', variant: 'warning', confirmText: 'Unlink' }))) return
          try {
            const result = await dispatch(unlinkPatient({ userId: id, patientId, patientName: patient?.name, targetUsername: user.username }))
            if (result.type.includes('rejected')) throw new Error(result.payload)
            success(`Unlinked ${patient?.name || 'patient'}`)
          } catch (err) { showError(err.message || 'Failed to unlink') }
        }

        const handleAutoLink = async () => {
          if (!user.mobile) { showError('User has no mobile number'); return }
          setLinking(true)
          try {
            const result = await dispatch(autoLinkByMobile({ userId: id, userMobile: user.mobile, targetUsername: user.username }))
            if (result.type.includes('rejected')) throw new Error(result.payload)
            const count = result.payload.linkedIds.length
            if (count > 0) success(`Auto-linked ${count} patient(s) by mobile`)
            else showError('No matching patients found')
          } catch (err) { showError(err.message || 'Auto-link failed') }
          finally { setLinking(false) }
        }

        return (
          <Row className="mt-3">
            <Col>
              <Card className="shadow-sm" style={{ borderLeft: '4px solid #0891B2' }}>
                <Card.Header className="card-header-theme d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fs-responsive-md">
                    <FaLink className="me-2" />
                    Linked Patients
                    {linkedList.length > 0 && <Badge bg="info" className="ms-2">{linkedList.length}</Badge>}
                  </h5>
                  {user.mobile && (
                    <Button size="sm" variant="outline-info" onClick={handleAutoLink} disabled={linking}>
                      <FaMagic className="me-1" />
                      Auto-link by Mobile
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  {linkedList.length > 0 ? (
                    <div className="mb-3">
                      {linkedList.map(p => (
                        <div key={p.id} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <div>
                            <strong>{p.name}</strong>
                            <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>{p.mobile || ''} {p.age ? `| ${p.age}yr` : ''} {p.gender ? `| ${p.gender}` : ''}</span>
                          </div>
                          <Button size="sm" variant="outline-danger" onClick={() => handleUnlink(p.id)}>
                            <FaUnlink className="me-1" />Unlink
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-3">No patients linked to this user.</p>
                  )}

                  <div className="d-flex gap-2 align-items-center">
                    <Form.Select size="sm" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} style={{ maxWidth: 350 }}>
                      <option value="">Select a patient to link...</option>
                      {availablePatients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} {p.mobile ? `(${p.mobile})` : ''}</option>
                      ))}
                    </Form.Select>
                    <Button size="sm" variant="primary" onClick={handleLink} disabled={!selectedPatientId || linking}>
                      <FaLink className="me-1" />{linking ? 'Linking...' : 'Link'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )
      })()}
    </Container>
  )
}

export default UserDetail
