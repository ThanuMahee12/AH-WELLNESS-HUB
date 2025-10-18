import React from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import FormField from '../ui/FormField';

/**
 * Reusable CRUD Modal Component
 * Handles add/edit modals with dynamic form fields
 *
 * @param {Object} props
 * @param {boolean} props.show - Modal visibility
 * @param {string} props.title - Modal title
 * @param {boolean} props.isEditing - Whether in edit mode
 * @param {Array} props.fields - Form field definitions
 * @param {Object} props.formData - Form data object
 * @param {Object} props.formErrors - Form errors object
 * @param {Function} props.onFormChange - Form change handler
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.loading - Loading state
 * @param {string} props.size - Modal size (sm, lg, xl)
 */
const CRUDModal = React.memo(({
  show,
  title,
  isEditing = false,
  fields = [],
  formData = {},
  formErrors = {},
  onFormChange,
  onSubmit,
  onClose,
  loading = false,
  size = 'lg',
  children,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal show={show} onHide={onClose} size={size} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {children || (
            <Row>
              {fields.map((field) => (
                <Col
                  key={field.name}
                  xs={12}
                  md={field.colSize || 6}
                >
                  <FormField
                    label={field.label}
                    name={field.name}
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={onFormChange}
                    error={formErrors[field.name]}
                    required={field.required}
                    placeholder={field.placeholder}
                    options={field.options}
                    disabled={loading || field.disabled}
                    rows={field.rows}
                    {...(field.props || {})}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
});

CRUDModal.displayName = 'CRUDModal';

export default CRUDModal;
