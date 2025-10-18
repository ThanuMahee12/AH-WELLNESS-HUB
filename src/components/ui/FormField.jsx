import React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Reusable Form Field Component
 * Handles text, email, number, tel, textarea, select inputs
 *
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name
 * @param {string} props.type - Input type
 * @param {any} props.value - Field value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.placeholder - Placeholder text
 * @param {Array} props.options - Options for select input
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {number} props.rows - Rows for textarea
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
      <Form.Group className="mb-3">
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
    <Form.Group className="mb-3">
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

export default FormField;
