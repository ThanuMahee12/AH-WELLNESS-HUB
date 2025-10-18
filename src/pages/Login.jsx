import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { FaUser, FaLock, FaFlask } from 'react-icons/fa'
import { loginUser } from '../store/authSlice'
import { useForm } from '../hooks'
import '../styles/Login.css'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(state => state.auth)

  // Handle login submission
  const handleLoginSubmit = async (formData) => {
    const result = await dispatch(loginUser(formData))

    if (result.type === 'auth/login/fulfilled') {
      navigate('/dashboard')
    } else {
      throw new Error(result.payload || 'Login failed')
    }
  }

  // Use form hook for login
  const { formData, handleChange, handleSubmit, isSubmitting } = useForm(
    { email: '', password: '' },
    handleLoginSubmit
  )

  return (
    <div className="login-wrapper">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} sm={10} md={8} lg={5} xl={4}>
            <Card className="login-card shadow-lg border-0">
              <Card.Header className="login-header text-center py-3 border-0">
                <div className="login-icon-wrapper mb-2">
                  <FaFlask className="login-icon" />
                </div>
                <h2 className="mb-1 fw-bold">Blood Lab Manager</h2>
                <p className="mb-0 opacity-75" style={{ fontSize: '0.9rem' }}>Point of Sale System</p>
              </Card.Header>
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" className="mb-3">
                    <strong>Error!</strong> {error}
                  </Alert>
                )}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaUser className="me-2" />Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading || isSubmitting}
                      className="login-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaLock className="me-2" />Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading || isSubmitting}
                      className="login-input"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 login-button mt-3"
                    disabled={loading || isSubmitting}
                  >
                    {loading || isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Logging in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Login
