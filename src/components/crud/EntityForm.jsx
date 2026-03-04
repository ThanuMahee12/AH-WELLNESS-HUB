import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { FaSave, FaTrash } from 'react-icons/fa';
import FormField from '../ui/FormField';
import RichTextEditor from '../ui/RichTextEditor';

const EntityForm = React.memo(({
  title,
  fields = [],
  formData = {},
  formErrors = {},
  onFormChange,
  onSubmit,
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
      <Card.Header className="card-header-theme">
        <h5 className="mb-0 fs-responsive-md">{title}</h5>
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

        <Card.Footer className="entity-form-footer justify-content-end">
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
              className="entity-form-btn btn-theme"
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
        </Card.Footer>
      </Form>
    </Card>
  );
});

EntityForm.displayName = 'EntityForm';
EntityForm.propTypes = {
  title: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    type: PropTypes.string,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
    options: PropTypes.array,
    colSize: PropTypes.number
  })),
  formData: PropTypes.object,
  formErrors: PropTypes.object,
  onFormChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  loading: PropTypes.bool,
  isEditing: PropTypes.bool,
  children: PropTypes.node
};

export default EntityForm;
