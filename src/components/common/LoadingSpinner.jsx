import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from 'react-bootstrap';

/**
 * Reusable Loading Spinner Component
 */
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
  );
};

LoadingSpinner.propTypes = {
  /** Spinner size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Bootstrap color variant */
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
  /** Loading text to display */
  text: PropTypes.string
};

export default LoadingSpinner;
