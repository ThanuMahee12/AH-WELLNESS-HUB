import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Badge, Alert, Modal, Button, Form, Card, ListGroup } from 'react-bootstrap'
import { FaUsers, FaKey, FaCopy, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa'
import { fetchUsers, updateUser, deleteUser, selectAllUsers } from '../store/usersSlice'
import { registerUser } from '../store/authSlice'
import {
  fetchUserChangeRequests,
  createUserChangeRequest,
  approveUserChangeRequest,
  rejectUserChangeRequest,
  selectAllUserChangeRequests
} from '../store/userChangeRequestsSlice'
import { authService } from '../services/authService'
import { useCRUD } from '../hooks'
import { useNotification } from '../context'
import { PageHeader } from '../components/ui'
import { CRUDTable } from '../components/crud'
import { generateRandomPassword, copyToClipboard } from '../utils/passwordUtils'

// Form field configuration
const getUserFields = (currentUserRole) => [
  { name: 'username', label: 'Username', type: 'text', required: true, colSize: 6 },
  { name: 'email', label: 'Email', type: 'email', required: true, colSize: 6 },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, colSize: 6 },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    colSize: 6,
    options: currentUserRole === 'superadmin'
      ? [
          { value: 'user', label: 'User' },
          { value: 'editor', label: 'Editor' },
          { value: 'maintainer', label: 'Maintainer' },
          { value: 'superadmin', label: 'Super Admin' },
        ]
      : [
          { value: 'user', label: 'User' },
          { value: 'editor', label: 'Editor' },
          { value: 'maintainer', label: 'Maintainer' },
        ]
  },
]

function UsersEnhanced() {
  const dispatch = useDispatch()
  const users = useSelector(selectAllUsers)
  const { user: currentUser } = useSelector(state => state.auth)
  const { loading } = useSelector(state => state.users)
  const changeRequests = useSelector(selectAllUserChangeRequests)
  const { success, error: showError } = useNotification()

  const [formError, setFormError] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUserId, setResetUserId] = useState(null)

  const isSuperAdmin = currentUser?.role === 'superadmin'
  const isMaintainer = currentUser?.role === 'maintainer'

  useEffect(() => {
    dispatch(fetchUserChangeRequests())
  }, [dispatch])

  // Pending requests count
  const pendingRequestsCount = changeRequests.filter(r => r.status === 'pending').length

  // Table column configuration
  const TABLE_COLUMNS = [
    { key: 'username', label: 'Username', render: (value) => <strong>{value}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'role',
      label: 'Role',
      render: (value) => {
        const colors = {
          superadmin: 'danger',
          maintainer: 'primary',
          editor: 'warning',
          user: 'info',
          admin: 'primary' // backward compatibility
        }
        return <Badge bg={colors[value] || 'secondary'}>{value}</Badge>
      }
    },
  ]

  // Custom actions column for superadmin
  if (isSuperAdmin) {
    TABLE_COLUMNS.push({
      key: 'actions',
      label: 'Actions',
      render: (value, item) => (
        <Button
          size="sm"
          variant="outline-warning"
          onClick={() => handleResetPassword(item)}
        >
          <FaKey /> Reset Password
        </Button>
      )
    })
  }

  const handleResetPassword = (user) => {
    setResetUserId(user)
    setShowResetModal(true)
  }

  const confirmResetPassword = async () => {
    if (!resetUserId) return

    const newPassword = generateRandomPassword()

    try {
      // Send password reset email
      const result = await authService.resetPassword(resetUserId.email)

      if (result.success) {
        setGeneratedPassword(newPassword)
        setShowPasswordModal(true)
        setShowResetModal(false)
        success(`Password reset email sent to ${resetUserId.email}`)
      } else {
        showError(result.error || 'Failed to send reset email')
      }
    } catch (error) {
      showError('Failed to reset password')
    }
  }

  // Handle submission based on role
  const handleUserSubmit = async (formData, editingItem) => {
    setFormError('')

    // If maintainer, create a change request
    if (isMaintainer) {
      const requestData = {
        type: editingItem ? 'update' : 'create',
        userId: editingItem?.id || null,
        requestedBy: currentUser.uid,
        requestedByName: currentUser.username,
        data: formData,
        originalData: editingItem || null,
      }

      const result = await dispatch(createUserChangeRequest(requestData))
      if (result.type.includes('fulfilled')) {
        success('Change request submitted for approval')
        return true
      } else {
        const errorMsg = result.payload || 'Failed to create request'
        setFormError(errorMsg)
        showError(errorMsg)
        throw new Error(errorMsg)
      }
    }

    // Superadmin can make direct changes
    if (isSuperAdmin) {
      if (editingItem) {
        // Update existing user - only send updatable fields (not email)
        const updateData = {
          username: formData.username,
          mobile: formData.mobile,
          role: formData.role
        }
        const result = await dispatch(updateUser({ id: editingItem.id, ...updateData }))
        if (result.type.includes('fulfilled')) {
          success('User updated successfully!')
          return true
        } else {
          const errorMsg = result.payload || 'Failed to update user'
          setFormError(errorMsg)
          showError(errorMsg)
          throw new Error(errorMsg)
        }
      } else {
        // Create new user with random password
        const randomPassword = generateRandomPassword()
        const result = await dispatch(registerUser({ ...formData, password: randomPassword }))

        if (result.type.includes('fulfilled')) {
          dispatch(fetchUsers())
          setGeneratedPassword(randomPassword)
          setShowPasswordModal(true)
          success('User created successfully!')
          return true
        } else {
          const errorMsg = result.payload || 'Failed to create user'
          setFormError(errorMsg)
          showError(errorMsg)
          throw new Error(errorMsg)
        }
      }
    }
  }

  const handleApproveRequest = async (request) => {
    try {
      // Execute the requested change
      if (request.type === 'create') {
        const randomPassword = generateRandomPassword()
        const result = await dispatch(registerUser({ ...request.data, password: randomPassword }))

        if (result.type.includes('fulfilled')) {
          await dispatch(approveUserChangeRequest({
            requestId: request.id,
            approvedBy: currentUser.uid
          }))
          dispatch(fetchUsers())
          setGeneratedPassword(randomPassword)
          setShowPasswordModal(true)
          success('User created and request approved!')
        } else {
          showError('Failed to create user')
        }
      } else if (request.type === 'update') {
        const result = await dispatch(updateUser({ id: request.userId, ...request.data }))

        if (result.type.includes('fulfilled')) {
          await dispatch(approveUserChangeRequest({
            requestId: request.id,
            approvedBy: currentUser.uid
          }))
          success('User updated and request approved!')
        } else {
          showError('Failed to update user')
        }
      }
    } catch (error) {
      showError('Failed to approve request')
    }
  }

  const handleRejectRequest = async (request, reason = 'Not approved') => {
    try {
      await dispatch(rejectUserChangeRequest({
        requestId: request.id,
        rejectedBy: currentUser.uid,
        reason
      }))
      success('Request rejected')
    } catch (error) {
      showError('Failed to reject request')
    }
  }

  const handleCopyPassword = async () => {
    const copied = await copyToClipboard(generatedPassword)
    if (copied) {
      success('Password copied to clipboard!')
    } else {
      showError('Failed to copy password')
    }
  }

  const {
    showModal,
    isEditing,
    formData,
    formErrors,
    isSubmitting,
    handleChange,
    handleOpen,
    handleClose,
    handleDelete,
    editingItem,
  } = useCRUD({
    fetchAction: fetchUsers,
    addAction: null,
    updateAction: null,
    deleteAction: deleteUser,
    initialFormState: {
      username: '',
      email: '',
      mobile: '',
      role: 'user',
    },
    onSuccess: (action) => {
      if (action === 'deleted') {
        success('User deleted successfully!')
      }
    },
    onError: (err) => {
      showError(err.message || 'Operation failed')
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await handleUserSubmit(formData, editingItem)
      handleClose()
      setFormError('')
    } catch (error) {
      // Error already handled
    }
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaUsers}
        title="Users Management"
        onAddClick={() => handleOpen()}
        addButtonText={isMaintainer ? "Request New User" : "Add New User"}
      />

      {isSuperAdmin && pendingRequestsCount > 0 && (
        <Alert variant="info" className="mb-3 d-flex justify-content-between align-items-center">
          <span>
            <FaClock className="me-2" />
            You have {pendingRequestsCount} pending change request{pendingRequestsCount > 1 ? 's' : ''}
          </span>
          <Button variant="info" size="sm" onClick={() => setShowRequestsModal(true)}>
            View Requests
          </Button>
        </Alert>
      )}

      <Row>
        <Col>
          <CRUDTable
            data={users}
            columns={TABLE_COLUMNS}
            onEdit={handleOpen}
            onDelete={isSuperAdmin ? (id) => handleDelete(id, 'Are you sure you want to delete this user?') : null}
            loading={loading}
            emptyMessage="No users found. Add your first user to get started."
          />
        </Col>
      </Row>

      {/* User Form Modal */}
      <Modal show={showModal} onHide={() => {
        handleClose()
        setFormError('')
      }} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? (isMaintainer ? 'Request User Edit' : 'Edit User') : (isMaintainer ? 'Request New User' : 'Add New User')}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formError && <Alert variant="danger" className="mb-3">{formError}</Alert>}

            {isMaintainer && (
              <Alert variant="info" className="mb-3">
                This {isEditing ? 'edit' : 'new user'} will require superadmin approval before taking effect.
              </Alert>
            )}

            <Row>
              {getUserFields(currentUser?.role).map((field) => (
                <Col key={field.name} xs={12} md={field.colSize || 6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      {field.label} {field.required && <span className="text-danger">*</span>}
                    </Form.Label>
                    {field.type === 'select' ? (
                      <Form.Select
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        type={field.type}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        disabled={isEditing && field.name === 'email'}
                      />
                    )}
                    {isEditing && field.name === 'email' && (
                      <Form.Text className="text-muted">
                        Email cannot be changed after user creation
                      </Form.Text>
                    )}
                    {formErrors[field.name] && (
                      <Form.Text className="text-danger">
                        {formErrors[field.name]}
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              handleClose()
              setFormError('')
            }} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : (isMaintainer ? 'Submit Request' : 'Add')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Password Display Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>User Created Successfully</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">
            <strong>Generated Password:</strong>
            <div className="mt-2 p-3 bg-white rounded border">
              <code className="fs-5">{generatedPassword}</code>
            </div>
          </Alert>
          <Alert variant="warning">
            <strong>Important:</strong> Copy this password now. It will not be shown again.
            Share it securely with the user.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCopyPassword}>
            <FaCopy /> Copy Password
          </Button>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Password Confirmation Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to reset the password for <strong>{resetUserId?.username}</strong>?</p>
          <Alert variant="info">
            A password reset email will be sent to: <strong>{resetUserId?.email}</strong>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={confirmResetPassword}>
            <FaKey /> Send Reset Email
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Requests Modal (Superadmin only) */}
      {isSuperAdmin && (
        <Modal show={showRequestsModal} onHide={() => setShowRequestsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>User Change Requests</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {changeRequests.filter(r => r.status === 'pending').length === 0 ? (
              <Alert variant="info">No pending requests</Alert>
            ) : (
              <ListGroup>
                {changeRequests.filter(r => r.status === 'pending').map(request => (
                  <ListGroup.Item key={request.id}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6>
                          <Badge bg={request.type === 'create' ? 'success' : 'warning'}>
                            {request.type === 'create' ? 'NEW USER' : 'UPDATE USER'}
                          </Badge>
                          {' '}by {request.requestedByName}
                        </h6>
                        <Card className="mt-2">
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <strong>Username:</strong> {request.data.username}<br/>
                                <strong>Email:</strong> {request.data.email}<br/>
                                <strong>Mobile:</strong> {request.data.mobile}<br/>
                                <strong>Role:</strong> <Badge bg="info">{request.data.role}</Badge>
                              </Col>
                              {request.originalData && (
                                <Col md={6}>
                                  <small className="text-muted">Previous values:</small><br/>
                                  <small>Username: {request.originalData.username}</small><br/>
                                  <small>Email: {request.originalData.email}</small><br/>
                                  <small>Mobile: {request.originalData.mobile}</small><br/>
                                  <small>Role: <Badge bg="secondary">{request.originalData.role}</Badge></small>
                                </Col>
                              )}
                            </Row>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                    <div className="mt-3 d-flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApproveRequest(request)}
                      >
                        <FaCheckCircle /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRejectRequest(request)}
                      >
                        <FaTimesCircle /> Reject
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRequestsModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  )
}

export default UsersEnhanced
