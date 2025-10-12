import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaUsers } from 'react-icons/fa'
import { fetchUsers, updateUser, deleteUser } from '../store/usersSlice'
import { registerUser } from '../store/authSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'

function Users() {
  const dispatch = useDispatch()
  const { users, loading, error } = useSelector(state => state.users)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    mobile: '',
    role: 'user'
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  const handleClose = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ username: '', email: '', password: '', mobile: '', role: 'user' })
    setFormError('')
  }

  const handleShow = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({ ...user, password: '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (editingUser) {
      // Update existing user profile
      const result = await dispatch(updateUser({ id: editingUser.id, ...formData }))
      if (result.type.includes('fulfilled')) {
        handleClose()
      } else {
        setFormError(result.payload || 'Failed to update user')
      }
    } else {
      // Create new user with Firebase Auth + Firestore
      const result = await dispatch(registerUser(formData))
      if (result.type.includes('fulfilled')) {
        handleClose()
        dispatch(fetchUsers()) // Refresh user list
      } else {
        setFormError(result.payload || 'Failed to create user')
      }
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await dispatch(deleteUser(id))
    }
  }

  if (loading && users.length === 0) {
    return <LoadingSpinner text="Loading users..." />
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h2><FaUsers className="me-2 text-secondary" />Users Management</h2>
            <Button variant="secondary" onClick={() => handleShow()} className="mt-2 mt-md-0">
              <FaPlus className="me-2" />Add New User
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <ErrorAlert error={error} />
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Body className="p-0">
              {users.length === 0 ? (
                <div className="text-center p-5">
                  <FaUsers size={50} className="text-muted mb-3" />
                  <p className="text-muted">No users found. Add your first user to get started.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover className="mb-0 table-mobile-responsive">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Role</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id || user.uid}>
                          <td data-label="Username"><strong>{user.username}</strong></td>
                          <td data-label="Email">{user.email}</td>
                          <td data-label="Mobile">{user.mobile}</td>
                          <td data-label="Role">
                            <Badge bg={user.role === 'admin' ? 'warning' : 'info'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td data-label="Actions">
                            <div className="d-flex gap-2 justify-content-center">
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleShow(user)}
                                disabled={loading}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(user.id || user.uid)}
                                disabled={loading}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Edit User' : 'Add New User'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Role *</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="secondary" type="submit">
              {editingUser ? 'Update' : 'Add'} User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Users
