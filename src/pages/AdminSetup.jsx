import { useState } from 'react'
import { Container, Row, Col, Card, Button, Alert, Form, Badge } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { ROLES } from '../constants/roles'
import { FaUserShield, FaExclamationTriangle } from 'react-icons/fa'

/**
 * Admin Setup Page
 * One-time use page to make your account SuperAdmin
 *
 * Access this page by going to: /admin-setup
 * After setup, this page can be removed or protected
 */
function AdminSetup() {
  const user = useSelector((state) => state.auth.user)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const makeMeSuperAdmin = async () => {
    if (!confirmed) {
      setMessage({
        type: 'warning',
        text: 'Please check the confirmation box below'
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Update current user to superadmin
      await updateDoc(doc(db, 'users', user.uid), {
        role: ROLES.SUPERADMIN,
        upgradedAt: new Date().toISOString(),
        upgradedBy: 'self',
      })

      setMessage({
        type: 'success',
        text: '✅ SUCCESS! You are now a SuperAdmin. Please logout and login again for changes to take effect.'
      })

    } catch (error) {
      setMessage({
        type: 'danger',
        text: `❌ Error: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <FaExclamationTriangle className="me-2" />
          Please login first to access this page.
        </Alert>
      </Container>
    )
  }

  // If already superadmin
  if (user.role === ROLES.SUPERADMIN) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-success">
              <Card.Header className="bg-success text-white text-center py-3">
                <h3>
                  <FaUserShield className="me-2" />
                  SuperAdmin Status
                </h3>
              </Card.Header>
              <Card.Body className="text-center p-4">
                <Badge bg="success" className="fs-4 mb-3">
                  ✅ Active SuperAdmin
                </Badge>
                <h5 className="mt-3 mb-3">You already have SuperAdmin privileges!</h5>

                <div className="bg-light p-3 rounded mb-3">
                  <strong>User:</strong> {user.username}<br />
                  <strong>Email:</strong> {user.email}<br />
                  <strong>Role:</strong> <Badge bg="danger">{user.role}</Badge>
                </div>

                <Alert variant="info">
                  <strong>What you can do:</strong>
                  <ul className="text-start mt-2 mb-0">
                    <li>Create, edit, delete all records directly</li>
                    <li>Manage all users and change their roles</li>
                    <li>Approve all pending requests</li>
                    <li>View user IDs and complete audit trail</li>
                    <li>Full system control</li>
                  </ul>
                </Alert>

                <Button variant="primary" href="/dashboard">
                  Go to Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg">
            <Card.Header className="bg-danger text-white text-center py-3">
              <h3>
                <FaUserShield className="me-2" />
                SuperAdmin Setup
              </h3>
            </Card.Header>
            <Card.Body className="p-4">
              <Alert variant="warning">
                <FaExclamationTriangle className="me-2" />
                <strong>Important:</strong> This page allows you to upgrade your account to SuperAdmin.
                Only use this if you are the system administrator.
              </Alert>

              <div className="bg-light p-3 rounded mb-3">
                <h6 className="mb-2">Current Account:</h6>
                <strong>Username:</strong> {user.username}<br />
                <strong>Email:</strong> {user.email}<br />
                <strong>Current Role:</strong> <Badge bg="secondary">{user.role}</Badge>
              </div>

              <div className="mb-4">
                <h6 className="mb-2">SuperAdmin Capabilities:</h6>
                <ul className="mb-0">
                  <li>✅ Full CRUD access to all resources</li>
                  <li>✅ Manage all users and change roles</li>
                  <li>✅ Approve/reject all requests</li>
                  <li>✅ View user IDs and sensitive data</li>
                  <li>✅ Trigger password resets</li>
                  <li>✅ Complete system control</li>
                </ul>
              </div>

              {message && (
                <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
                  {message.text}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="confirm-superadmin"
                  label="I understand that I will have full system access and confirm I am the system administrator"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={makeMeSuperAdmin}
                  disabled={!confirmed || loading}
                >
                  {loading ? 'Upgrading...' : '🔐 Make Me SuperAdmin'}
                </Button>
              </div>

              <Alert variant="info" className="mt-3 mb-0">
                <small>
                  <strong>After upgrading:</strong>
                  <ol className="mb-0 mt-2">
                    <li>Logout from the application</li>
                    <li>Login again to apply changes</li>
                    <li>You will have full SuperAdmin access</li>
                  </ol>
                </small>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AdminSetup
