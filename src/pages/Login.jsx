import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Form, Alert, Spinner, Row, Col } from 'react-bootstrap'
import { FaUser, FaLock, FaFlask, FaEnvelope, FaPhone } from 'react-icons/fa'
import { ICON_MAP } from '../constants/defaultSettings'
import { loginUser, setUser } from '../store/authSlice'
import { authService } from '../services/authService'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'
import { useForm } from '../hooks'
import { useSettings } from '../hooks/useSettings'
import '../styles/Login.css'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const loginSettings = settings?.pages?.login
  const resetPasswordRoles = loginSettings?.showResetPassword
  const signUpRoles = loginSettings?.showSignUp
  const loginContent = loginSettings?.content || {}
  const brandTitle = loginContent.brandTitle || ''
  const brandSubtitle = loginContent.brandSubtitle || ''
  const brandFeatures = loginContent.brandFeatures || []
  const showResetPassword = Array.isArray(resetPasswordRoles) ? resetPasswordRoles.length > 0 : resetPasswordRoles !== false
  const showSignUp = Array.isArray(signUpRoles) ? signUpRoles.length > 0 : signUpRoles !== false

  const [view, setView] = useState('login') // 'login' | 'forgot' | 'signup'
  const [message, setMessage] = useState('')

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
      dispatch(setUser(result.user))
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

  const activeForm = view === 'login' ? loginForm : view === 'forgot' ? forgotForm : signupForm
  const busy = loading || activeForm.isSubmitting
  const formError = error || activeForm.errors.submit

  const headerText = {
    login: { title: loginContent.loginTitle || '', subtitle: loginContent.loginSubtitle || '' },
    forgot: { title: loginContent.forgotTitle || '', subtitle: loginContent.forgotSubtitle || '' },
    signup: { title: loginContent.signupTitle || '', subtitle: loginContent.signupSubtitle || '' }
  }

  return (
    <div className="login-wrapper">
      {/* Left branding panel - desktop only */}
      <div className="login-brand-panel">
        <div className="brand-logo-circle">
          <FaFlask className="login-icon" />
        </div>
        <h1 className="brand-title">{brandTitle}</h1>
        <p className="brand-subtitle">{brandSubtitle}</p>
        {brandFeatures.length > 0 && (
          <div className="brand-features">
            {brandFeatures.map((feat, i) => {
              const Icon = ICON_MAP[feat.icon] || FaFlask
              return (
                <div key={i} className="brand-feature-item">
                  <div className="brand-feature-icon"><Icon size={14} /></div>
                  <span>{feat.text}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Mobile header */}
      <div className="login-mobile-header d-md-none">
        <div className="brand-logo-circle">
          <FaFlask className="login-icon" />
        </div>
        <h1 className="brand-title">{brandTitle}</h1>
        <p className="brand-subtitle">{brandSubtitle}</p>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <h2 className="login-form-title">{headerText[view].title}</h2>
          <p className="login-form-subtitle">{headerText[view].subtitle}</p>

          {formError && (
            <Alert variant="danger" className="mb-3 py-2">
              {formError}
            </Alert>
          )}
          {message && (
            <Alert variant="success" className="mb-3 py-2">
              {message}
            </Alert>
          )}

          {/* --- Login View --- */}
          {view === 'login' && (
            <div className="login-view-enter" key="login">
              <Form onSubmit={loginForm.handleSubmit}>
                <div className="login-input-group">
                  <FaEnvelope className="login-input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={loginForm.formData.email}
                    onChange={loginForm.handleChange}
                    required
                    disabled={busy}
                    className="login-input"
                    autoComplete="email"
                  />
                </div>

                <div className="login-input-group">
                  <FaLock className="login-input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={loginForm.formData.password}
                    onChange={loginForm.handleChange}
                    required
                    disabled={busy}
                    className="login-input"
                    autoComplete="current-password"
                  />
                </div>

                {showResetPassword && (
                  <div className="text-end mb-3" style={{ marginTop: '-0.5rem' }}>
                    <button type="button" className="login-link" onClick={() => switchView('forgot')}>
                      Forgot password?
                    </button>
                  </div>
                )}

                <button type="submit" className="login-button w-100" disabled={busy}>
                  {busy ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>

                {showSignUp && (
                  <div className="login-footer">
                    Don&apos;t have an account?{' '}
                    <button type="button" className="login-link" onClick={() => switchView('signup')}>
                      Sign Up
                    </button>
                  </div>
                )}
              </Form>
            </div>
          )}

          {/* --- Forgot Password View --- */}
          {view === 'forgot' && (
            <div className="login-view-enter" key="forgot">
              <Form onSubmit={forgotForm.handleSubmit}>
                <div className="login-input-group">
                  <FaEnvelope className="login-input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your registered email"
                    value={forgotForm.formData.email}
                    onChange={forgotForm.handleChange}
                    required
                    disabled={busy}
                    className="login-input"
                    autoComplete="email"
                  />
                </div>

                <button type="submit" className="login-button w-100" disabled={busy}>
                  {busy ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Sending...
                    </>
                  ) : 'Send Reset Link'}
                </button>

                <div className="login-footer">
                  <button type="button" className="login-link" onClick={() => switchView('login')}>
                    Back to Sign In
                  </button>
                </div>
              </Form>
            </div>
          )}

          {/* --- Sign Up View --- */}
          {view === 'signup' && (
            <div className="login-view-enter" key="signup">
              <Form onSubmit={signupForm.handleSubmit}>
                <Row>
                  <Col xs={12} md={6}>
                    <div className="login-input-group">
                      <FaUser className="login-input-icon" />
                      <input
                        type="text"
                        name="username"
                        placeholder="Full name"
                        value={signupForm.formData.username}
                        onChange={signupForm.handleChange}
                        required
                        disabled={busy}
                        className="login-input"
                        autoComplete="name"
                      />
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <div className="login-input-group">
                      <FaEnvelope className="login-input-icon" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={signupForm.formData.email}
                        onChange={signupForm.handleChange}
                        required
                        disabled={busy}
                        className="login-input"
                        autoComplete="email"
                      />
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <div className="login-input-group">
                      <FaPhone className="login-input-icon" />
                      <input
                        type="tel"
                        name="mobile"
                        placeholder="Mobile number"
                        value={signupForm.formData.mobile}
                        onChange={signupForm.handleChange}
                        disabled={busy}
                        className="login-input"
                        autoComplete="tel"
                      />
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <div className="login-input-group">
                      <FaLock className="login-input-icon" />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password (min 6 chars)"
                        value={signupForm.formData.password}
                        onChange={signupForm.handleChange}
                        required
                        minLength={6}
                        disabled={busy}
                        className="login-input"
                        autoComplete="new-password"
                      />
                    </div>
                  </Col>
                </Row>

                <button type="submit" className="login-button w-100" disabled={busy}>
                  {busy ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Creating Account...
                    </>
                  ) : 'Create Account'}
                </button>

                <div className="login-footer">
                  Already have an account?{' '}
                  <button type="button" className="login-link" onClick={() => switchView('login')}>
                    Sign In
                  </button>
                </div>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
