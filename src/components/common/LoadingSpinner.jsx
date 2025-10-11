import { Spinner } from 'react-bootstrap'

export const LoadingSpinner = ({ size = 'md', variant = 'primary', text = 'Loading...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <Spinner
        animation="border"
        variant={variant}
        size={size === 'sm' ? 'sm' : undefined}
        style={{ width: size === 'lg' ? '3rem' : undefined, height: size === 'lg' ? '3rem' : undefined }}
      />
      {text && <p className="mt-3 text-muted">{text}</p>}
    </div>
  )
}

export default LoadingSpinner
