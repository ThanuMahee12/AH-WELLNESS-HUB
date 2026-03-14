import React from 'react'
import { Button, Container } from 'react-bootstrap'
import { FaExclamationTriangle } from 'react-icons/fa'
import { logError } from '../services/errorLogService'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    const user = this.props.user || {}
    logError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack || '',
      source: 'ErrorBoundary',
      userId: user.uid || '',
      username: user.username || user.email || '',
      userRole: user.role || '',
    })
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="d-flex flex-column align-items-center justify-content-center py-5">
          <FaExclamationTriangle size={48} className="text-warning mb-3" />
          <h4>Something went wrong</h4>
          <p className="text-muted mb-3">An unexpected error occurred. The error has been logged.</p>
          <Button variant="primary" onClick={this.handleReload}>
            Reload Page
          </Button>
        </Container>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
