import { Alert } from 'react-bootstrap'
import { FaExclamationCircle } from 'react-icons/fa'

export const ErrorAlert = ({ error, onDismiss }) => {
  if (!error) return null

  return (
    <Alert variant="danger" dismissible={!!onDismiss} onClose={onDismiss} className="d-flex align-items-center">
      <FaExclamationCircle className="me-2" />
      <span>{typeof error === 'string' ? error : 'An error occurred'}</span>
    </Alert>
  )
}

export default ErrorAlert
