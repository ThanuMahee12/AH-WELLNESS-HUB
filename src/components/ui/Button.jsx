import PropTypes from 'prop-types'
import { Button as BSButton, Spinner } from 'react-bootstrap'

/**
 * Reusable Button Component
 * Uses CSS classes from theme.css for consistent styling
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  className = '',
  ...rest
}) => {
  // Map variant to CSS class
  const variantClasses = {
    primary: 'btn-theme-gradient',
    secondary: 'btn-theme-secondary',
    success: 'btn-theme-success-gradient',
    danger: 'btn-theme-danger-gradient',
    gradient: 'btn-theme-gradient'
  }

  // Map size to CSS class
  const sizeClasses = {
    sm: 'btn-theme-sm',
    md: 'btn-theme-md',
    lg: 'btn-theme-lg'
  }

  const buttonClasses = [
    'btn-theme-base',
    variantClasses[variant] || 'btn-theme-gradient',
    sizeClasses[size] || 'btn-theme-md',
    fullWidth ? 'w-100' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <BSButton
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="me-2" />
          Loading...
        </>
      ) : children}
    </BSButton>
  )
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'gradient']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string
}

export default Button
