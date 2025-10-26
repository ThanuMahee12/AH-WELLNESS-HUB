import React from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import FormField from '../ui/FormField';
import RichTextEditor from '../ui/RichTextEditor';

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
    <Modal
      show={show}
      onHide={onClose}
      size={size}
      backdrop="static"
      centered
      scrollable
      fullscreen="md-down"
      className="crud-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="w-100">{title}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body
          style={{
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            padding: '1rem'
          }}
          className="modal-body-responsive"
        >
          {children || (
            <Row className="g-3">
              {fields.map((field) => (
                <Col
                  key={field.name}
                  xs={12}
                  sm={field.colSize === 12 ? 12 : 12}
                  md={field.colSize || 6}
                >
                  {field.type === 'richtext' ? (
                    <RichTextEditor
                      label={field.label}
                      value={formData[field.name] || ''}
                      onChange={(value) => onFormChange({ target: { name: field.name, value } })}
                      error={formErrors[field.name]}
                      required={field.required}
                      placeholder={field.placeholder}
                      height={field.height || '200px'}
                      id={field.name}
                    />
                  ) : (
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
                  )}
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer className="modal-footer-responsive">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="w-100 w-md-auto"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="w-100 w-md-auto"
          >
            {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </Button>
        </Modal.Footer>
      </Form>

      <style>{`
        @media (max-width: 767px) {
          .crud-modal .modal-body-responsive {
            padding: 0.75rem !important;
            maxHeight: calc(100vh - 150px) !important;
          }

          .crud-modal .modal-footer-responsive {
            flex-direction: column;
            gap: 0.5rem;
          }

          .crud-modal .modal-footer-responsive .btn {
            width: 100%;
          }

          .crud-modal .modal-title {
            font-size: 1.1rem;
          }
        }

        @media (min-width: 768px) {
          .w-md-auto {
            width: auto !important;
          }
        }
      `}</style>
    </Modal>
  );
});

CRUDModal.displayName = 'CRUDModal';

export default CRUDModal;
