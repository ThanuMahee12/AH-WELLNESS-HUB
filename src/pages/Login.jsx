import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { FaUser, FaLock, FaFlask, FaEnvelope, FaPhone } from 'react-icons/fa'
import { loginUser, setUser } from '../store/authSlice'
import { authService } from '../services/authService'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'
import { useForm } from '../hooks'
import '../styles/Login.css'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(state => state.auth)
  const [view, setView] = useState('login') // 'login' | 'forgot' | 'signup'
  const [message, setMessage] = useState('')

  // Switch view and clear messages
  const switchView = (newView) => {
    setView(newView)
    setMessage('')
    loginForm.reset()
    forgotForm.reset()
    signupForm.reset()
  }

  // --- Login ---
  const handleLoginSubmit = async (formData) => {
    const result = await dispatch(loginUser(formData))
    if (result.type === 'auth/login/fulfilled') {
      navigate('/dashboard')
    } else {
      throw new Error(result.payload || 'Login failed')
    }
  }

  const loginForm = useForm(
    { email: '', password: '' },
    handleLoginSubmit
  )

  // --- Forgot Password ---
  const handleForgotSubmit = async (formData) => {
    const result = await authService.resetPassword(formData.email)
    if (result.success) {
      setMessage('Password reset link sent! Check your email.')
    } else {
      throw new Error(result.error || 'Failed to send reset email')
    }
  }

  const forgotForm = useForm(
    { email: '' },
    handleForgotSubmit
  )

  // --- Sign Up ---
  const handleSignupSubmit = async (formData) => {
    if (formData.password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    const result = await authService.selfRegister(formData)
    if (result.success) {
      // Set user in Redux first (onAuthStateChanged was skipped during registration)
      dispatch(setUser(result.user))
      // Log signup activity (non-blocking — don't let it break signup)
      try {
        await logActivity({
          userId: result.user.uid,
          username: result.user.username || result.user.email,
          userRole: result.user.role,
          activityType: ACTIVITY_TYPES.SIGNUP,
          description: createActivityDescription(ACTIVITY_TYPES.SIGNUP, { username: result.user.username }),
          metadata: { email: result.user.email }
        })
      } catch {
        // Activity logging is best-effort during signup
      }
      navigate('/dashboard')
    } else {
      throw new Error(result.error || 'Registration failed')
    }
  }

  const signupForm = useForm(
    { username: '', email: '', mobile: '', password: '' },
    handleSignupSubmit
  )

  // Get the active form's state
  const activeForm = view === 'login' ? loginForm : view === 'forgot' ? forgotForm : signupForm
  const busy = loading || activeForm.isSubmitting
  const formError = error || activeForm.errors.submit

  const headerText = {
    login: { title: 'Blood Lab Manager', subtitle: 'Point of Sale System' },
    forgot: { title: 'Reset Password', subtitle: 'Enter your email to receive a reset link' },
    signup: { title: 'Create Account', subtitle: 'Sign up to get started' }
  }

  return (
    <div className="login-wrapper">
      <Container fluid="md">
        <Row className="justify-content-center align-items-center min-vh-100 g-0">
          <Col xs={12} sm={10} md={view === 'signup' ? 10 : 8} lg={view === 'signup' ? 7 : 5} xl={view === 'signup' ? 6 : 4}>
            <Card className="login-card shadow-lg border-0">
              <Card.Header className="login-header text-center py-3 border-0">
                <div className="login-icon-wrapper mb-2">
                  <FaFlask className="login-icon" />
                </div>
                <h2 className="mb-1 fw-bold">{headerText[view].title}</h2>
                <p className="mb-0 opacity-75" style={{ fontSize: '0.9rem' }}>{headerText[view].subtitle}</p>
              </Card.Header>
              <Card.Body className="p-4">
                {formError && (
                  <Alert variant="danger" className="mb-3">
                    <strong>Error!</strong> {formError}
                  </Alert>
                )}
                {message && (
                  <Alert variant="success" className="mb-3">
                    {message}
                  </Alert>
                )}

                {/* --- Login View --- */}
                {view === 'login' && (
                  <Form onSubmit={loginForm.handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaUser className="me-2" />Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={loginForm.formData.email}
                        onChange={loginForm.handleChange}
                        required
                        disabled={busy}
                        className="login-input"
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>
                        <FaLock className="me-2" />Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={loginForm.formData.password}
                        onChange={loginForm.handleChange}
                        required
                        disabled={busy}
                        className="login-input"
                      />
                    </Form.Group>

                    <div className="text-end mb-3">
                      <Button
                        variant="link"
                        className="p-0 text-decoration-none"
                        style={{ color: '#0891B2', fontSize: '0.85rem' }}
                        onClick={() => switchView('forgot')}
                        type="button"
                      >
                        Forgot Password?
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      className="w-100 login-button"
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>

                    <div className="text-center mt-3">
                      <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        Don't have an account?{' '}
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none fw-semibold"
                          style={{ color: '#0891B2', fontSize: '0.9rem' }}
                          onClick={() => switchView('signup')}
                          type="button"
                        >
                          Sign Up
                        </Button>
                      </span>
                    </div>
                  </Form>
                )}

                {/* --- Forgot Password View --- */}
                {view === 'forgot' && (
                  <Form onSubmit={forgotForm.handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaEnvelope className="me-2" />Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your registered email"
                        value={forgotForm.formData.email}
                        onChange={forgotForm.handleChange}
                        required
                        disabled={busy}
                        className="login-input"
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      className="w-100 login-button mt-2"
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>

                    <div className="text-center mt-3">
                      <Button
                        variant="link"
                        className="p-0 text-decoration-none fw-semibold"
                        style={{ color: '#0891B2', fontSize: '0.9rem' }}
                        onClick={() => switchView('login')}
                        type="button"
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  </Form>
                )}

                {/* --- Sign Up View --- */}
                {view === 'signup' && (
                  <Form onSubmit={signupForm.handleSubmit}>
                    <Row>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaUser className="me-2" />Username
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="username"
                            placeholder="Enter your name"
                            value={signupForm.formData.username}
                            onChange={signupForm.handleChange}
                            required
                            disabled={busy}
                            className="login-input"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaEnvelope className="me-2" />Email Address
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={signupForm.formData.email}
                            onChange={signupForm.handleChange}
                            required
                            disabled={busy}
                            className="login-input"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaPhone className="me-2" />Mobile Number
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="mobile"
                            placeholder="Enter your mobile number"
                            value={signupForm.formData.mobile}
                            onChange={signupForm.handleChange}
                            disabled={busy}
                            className="login-input"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaLock className="me-2" />Password
                          </Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            placeholder="At least 6 characters"
                            value={signupForm.formData.password}
                            onChange={signupForm.handleChange}
                            required
                            minLength={6}
                            disabled={busy}
                            className="login-input"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      type="submit"
                      className="w-100 login-button mt-2"
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>

                    <div className="text-center mt-3">
                      <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        Already have an account?{' '}
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none fw-semibold"
                          style={{ color: '#0891B2', fontSize: '0.9rem' }}
                          onClick={() => switchView('login')}
                          type="button"
                        >
                          Sign In
                        </Button>
                      </span>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Login
