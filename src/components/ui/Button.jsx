import { Button as BSButton } from 'react-bootstrap'
import { motion } from 'framer-motion'

/**
 * Reusable Button Component with motion animations
 * @param {Object} props
 * @param {'primary'|'secondary'|'success'|'danger'|'gradient'} props.variant - Button style variant
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Make button full width
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {Object} props.motionProps - Framer motion props
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  motionProps = {},
  className = '',
  ...rest
}) => {
  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 10px 30px rgba(6, 182, 212, 0.35)'
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#0891B2',
      border: '2px solid #0891B2',
      boxShadow: '0 4px 15px rgba(8, 145, 178, 0.2)'
    },
    success: {
      background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 10px 30px rgba(20, 184, 166, 0.35)'
    },
    danger: {
      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 10px 30px rgba(239, 68, 68, 0.35)'
    },
    gradient: {
      background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 12px 35px rgba(6, 182, 212, 0.4)'
    }
  }

  const sizeStyles = {
    sm: {
      padding: '0.5rem 1.5rem',
      fontSize: '0.875rem'
    },
    md: {
      padding: '0.75rem 2rem',
      fontSize: '1rem'
    },
    lg: {
      padding: 'clamp(0.9rem, 3vw, 1.3rem) clamp(2rem, 5vw, 3rem)',
      fontSize: 'clamp(1rem, 3.5vw, 1.4rem)'
    }
  }

  const defaultMotionProps = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2 }
  }

  const combinedMotionProps = { ...defaultMotionProps, ...motionProps }

  return (
    <motion.div
      {...combinedMotionProps}
      style={{ display: fullWidth ? 'block' : 'inline-block', width: fullWidth ? '100%' : 'auto' }}
    >
      <BSButton
        onClick={onClick}
        disabled={disabled || loading}
        className={className}
        style={{
          ...variantStyles[variant],
          ...sizeStyles[size],
          borderRadius: '50px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled || loading ? 0.6 : 1,
          cursor: disabled || loading ? 'not-allowed' : 'pointer'
        }}
        {...rest}
      >
        {loading ? 'Loading...' : children}
      </BSButton>
    </motion.div>
  )
}

export default Button
