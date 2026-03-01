import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';

/**
 * Reusable Form Field Component
 * Handles text, email, number, tel, textarea, select inputs
 */
const FormField = React.memo(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  options = [],
  disabled = false,
  rows = 3,
  ...rest
}) => {
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Form.Control
            as="textarea"
            rows={rows}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            isInvalid={!!error}
            {...rest}
          />
        );

      case 'select':
        return (
          <Form.Select
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            isInvalid={!!error}
            {...rest}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option
                key={typeof option === 'object' ? option.value : option}
                value={typeof option === 'object' ? option.value : option}
              >
                {typeof option === 'object' ? option.label : option}
              </option>
            ))}
          </Form.Select>
        );

      case 'checkbox':
        return (
          <Form.Check
            type="checkbox"
            name={name}
            label={label}
            checked={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            isInvalid={!!error}
            {...rest}
          />
        );

      case 'radio':
        return (
          <div>
            {options.map((option) => (
              <Form.Check
                key={typeof option === 'object' ? option.value : option}
                type="radio"
                name={name}
                id={`${name}-${typeof option === 'object' ? option.value : option}`}
                label={typeof option === 'object' ? option.label : option}
                value={typeof option === 'object' ? option.value : option}
                checked={value === (typeof option === 'object' ? option.value : option)}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                isInvalid={!!error}
                inline
                {...rest}
              />
            ))}
          </div>
        );

      default:
        return (
          <Form.Control
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            isInvalid={!!error}
            {...rest}
          />
        );
    }
  };

  if (type === 'checkbox' || type === 'radio') {
    return (
      <Form.Group className="mb-3" controlId={name}>
        {type === 'radio' && label && (
          <Form.Label>
            {label}
            {required && <span className="text-danger ms-1">*</span>}
          </Form.Label>
        )}
        {renderInput()}
        {error && <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>{error}</Form.Control.Feedback>}
      </Form.Group>
    );
  }

  return (
    <Form.Group className="mb-3" controlId={name}>
      {label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}
      {renderInput()}
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
});

FormField.displayName = 'FormField';

FormField.propTypes = {
  /** Field label */
  label: PropTypes.string,
  /** Field name (required) */
  name: PropTypes.string.isRequired,
  /** Input type */
  type: PropTypes.oneOf(['text', 'email', 'number', 'tel', 'password', 'textarea', 'select', 'checkbox', 'radio', 'date', 'time', 'datetime-local']),
  /** Field value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  /** Change handler */
  onChange: PropTypes.func,
  /** Blur handler */
  onBlur: PropTypes.func,
  /** Error message */
  error: PropTypes.string,
  /** Whether field is required */
  required: PropTypes.bool,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Options for select/radio inputs */
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired
      })
    ])
  ),
  /** Whether field is disabled */
  disabled: PropTypes.bool,
  /** Rows for textarea */
  rows: PropTypes.number
};

export default FormField;
