import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { FaUser, FaLock } from 'react-icons/fa'
import { login } from '../store/authSlice'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const users = useSelector(state => state.users.users)

  const handleSubmit = (e) => {
    e.preventDefault()
    const user = users.find(u => u.email === email && u.password === password)

    if (user) {
      const { password: _, ...userWithoutPassword } = user
      dispatch(login(userWithoutPassword))
      navigate('/dashboard')
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h3>Blood Lab Manager</h3>
              <p className="mb-0">Point of Sale System</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label><FaUser className="me-2" />Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label><FaLock className="me-2" />Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                  Login
                </Button>
              </Form>

              <div className="mt-3 text-center text-muted">
                <small>Demo Credentials:</small><br />
                <small>Admin: admin@bloodlab.com / admin123</small><br />
                <small>User: user@bloodlab.com / user123</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Login
