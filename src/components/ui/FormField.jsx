import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';

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
  const inputStyle = { fontSize: '0.82rem' };
  const labelStyle = { fontSize: '0.82rem', fontWeight: 500, color: '#334155' };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Form.Control
            as="textarea"
            rows={rows}
            size="sm"
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            isInvalid={!!error}
            style={inputStyle}
            {...rest}
          />
        );

      case 'select':
        return (
          <Form.Select
            size="sm"
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            isInvalid={!!error}
            style={inputStyle}
            {...rest}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {!placeholder && <option value="">Select...</option>}
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
            style={{ fontSize: '0.82rem' }}
            {...rest}
          />
        );

      case 'radio':
        return (
          <div className="d-flex gap-3">
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
                style={{ fontSize: '0.82rem' }}
                {...rest}
              />
            ))}
          </div>
        );

      default:
        return (
          <Form.Control
            type={type}
            size="sm"
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            isInvalid={!!error}
            style={inputStyle}
            {...rest}
          />
        );
    }
  };

  if (type === 'checkbox' || type === 'radio') {
    return (
      <Form.Group className="mb-2" controlId={name}>
        {type === 'radio' && label && (
          <Form.Label style={labelStyle}>
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
    <Form.Group className="mb-2" controlId={name}>
      {label && (
        <Form.Label style={labelStyle}>
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
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['text', 'email', 'number', 'tel', 'password', 'textarea', 'select', 'checkbox', 'radio', 'date', 'time', 'datetime-local']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired
      })
    ])
  ),
  disabled: PropTypes.bool,
  rows: PropTypes.number
};

export default FormField;
