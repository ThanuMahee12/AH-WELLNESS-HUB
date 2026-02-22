import React from 'react';
import { Card, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaSave, FaTrash } from 'react-icons/fa';
import FormField from '../ui/FormField';
import RichTextEditor from '../ui/RichTextEditor';

const EntityForm = React.memo(({
  title,
  fields = [],
  formData = {},
  formErrors = {},
  onFormChange,
  onSubmit,
  onCancel,
  onDelete,
  loading = false,
  isEditing = false,
  children,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header
        style={{
          background: 'linear-gradient(135deg, #0891B2, #06B6D4)',
          color: 'white',
          padding: '0.75rem 1.25rem',
        }}
      >
        <h5 className="mb-0" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)' }}>{title}</h5>
      </Card.Header>

      <Form onSubmit={handleSubmit}>
        <Card.Body className="entity-form-body">
          {children || (
            <Row className="g-3">
              {fields.map((field) => (
                <Col
                  key={field.name}
                  xs={12}
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

          {formErrors.submit && (
            <div className="text-danger mt-2">{formErrors.submit}</div>
          )}
        </Card.Body>

        <Card.Footer className="entity-form-footer">
          <Button
            variant="outline-secondary"
            onClick={onCancel}
            disabled={loading}
            className="entity-form-btn"
          >
            <FaArrowLeft className="me-1" />
            Back
          </Button>

          <div className="entity-form-actions">
            {isEditing && onDelete && (
              <Button
                variant="outline-danger"
                onClick={onDelete}
                disabled={loading}
                className="entity-form-btn"
              >
                <FaTrash className="me-1" />
                Delete
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="entity-form-btn"
              style={{
                backgroundColor: '#06B6D4',
                border: 'none',
                color: 'white',
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="me-1" />
                  {isEditing ? 'Update' : 'Save'}
                </>
              )}
            </Button>
          </div>

          <style>{`
            .entity-form-body {
              padding: 1.25rem;
            }
            .entity-form-footer {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              justify-content: space-between;
              align-items: center;
              padding: 0.75rem 1.25rem;
            }
            .entity-form-actions {
              display: flex;
              gap: 0.5rem;
              flex-wrap: wrap;
            }
            .entity-form-btn {
              min-width: 100px;
              min-height: 44px;
            }

            @media (max-width: 767px) {
              .entity-form-body {
                padding: 0.75rem;
              }
              .entity-form-footer {
                flex-direction: column;
                gap: 0.5rem;
                padding: 0.75rem;
              }
              .entity-form-actions {
                width: 100%;
                flex-direction: column;
              }
              .entity-form-btn {
                width: 100%;
                min-height: 48px;
                font-size: 1rem;
              }
            }
          `}</style>
        </Card.Footer>
      </Form>
    </Card>
  );
});

EntityForm.displayName = 'EntityForm';

export default EntityForm;
