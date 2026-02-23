import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'
import { FaCog, FaArrowLeft } from 'react-icons/fa'
import { updateSettings } from '../store/settingsSlice'
import { useSettings } from '../hooks'
import { ENTITY_LABELS, FIELD_TYPE_OPTIONS, COL_SIZE_OPTIONS } from '../constants/defaultSettings'
import { useNotification } from '../context'

const EMPTY_FIELD = {
  label: '',
  type: 'text',
  visible: true,
  required: false,
  colSize: 6,
  placeholder: '',
  rows: 3,
}

function FieldSettingDetail() {
  const { entity, fieldKey } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { settings } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { success, error: showError } = useNotification()

  const isNew = fieldKey === 'new'
  const existing = !isNew ? settings?.forms?.[entity]?.fields?.[fieldKey] : null

  const [formData, setFormData] = useState(EMPTY_FIELD)
  const [newFieldName, setNewFieldName] = useState('')
  const [fieldNameError, setFieldNameError] = useState('')
  const [saving, setSaving] = useState(false)

  // Load existing field data
  useEffect(() => {
    if (existing) {
      setFormData({
        label: existing.label || '',
        type: existing.type || 'text',
        visible: existing.visible !== false,
        required: existing.required === true,
        colSize: existing.colSize ?? 6,
        placeholder: existing.placeholder || '',
        rows: existing.rows ?? 3,
      })
    }
  }, [existing?.label, existing?.type, existing?.visible, existing?.required, existing?.colSize, existing?.placeholder, existing?.rows]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateFieldName = useCallback((name) => {
    if (!name.trim()) return 'Field name is required'
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) return 'Letters, numbers, underscore only. Must start with a letter.'
    const fields = settings?.forms?.[entity]?.fields
    if (fields && fields[name]) return 'This field name already exists'
    return ''
  }, [settings, entity])

  const handleSave = async () => {
    const key = isNew ? newFieldName.trim() : fieldKey

    if (isNew) {
      const error = validateFieldName(key)
      if (error) {
        setFieldNameError(error)
        return
      }
    }

    if (!formData.label.trim()) {
      showError('Display name is required')
      return
    }

    setSaving(true)
    try {
      const fieldData = {
        label: formData.label.trim(),
        type: formData.type,
        visible: formData.visible,
        required: formData.visible ? formData.required : false,
        colSize: Number(formData.colSize),
        placeholder: formData.placeholder,
      }
      if (formData.type === 'textarea') {
        fieldData.rows = Number(formData.rows) || 3
      }

      await dispatch(updateSettings({
        data: {
          forms: {
            [entity]: {
              fields: {
                [key]: fieldData,
              },
            },
          },
        },
        user,
      }))

      success(isNew ? 'Field added successfully!' : 'Field updated successfully!')
      navigate('/settings')
    } catch (err) {
      showError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const firebaseType = FIELD_TYPE_OPTIONS.find(o => o.value === formData.type)?.firebaseType || 'string'

  // Not found
  if (!isNew && !existing && settings?.forms?.[entity]) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Field not found</h4>
            <Button onClick={() => navigate('/settings')} className="btn-theme">
              <FaArrowLeft className="me-2" /> Back to Settings
            </Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  return (
    <Container fluid className="p-3 p-md-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="fs-responsive-lg">
            <FaCog className="me-2 text-theme" />
            {isNew ? 'Add New Field' : 'Edit Field'}
            <small className="text-muted ms-2" style={{ fontSize: '0.6em' }}>
              {ENTITY_LABELS[entity]}
            </small>
          </h2>
        </Col>
      </Row>

      <Row>
        <Col xs={12} lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="card-header-theme">
              <h5 className="mb-0 fs-responsive-md">
                {isNew ? 'New Field Configuration' : `Field: ${fieldKey}`}
              </h5>
            </Card.Header>
            <Card.Body className="entity-form-body">
              <Form>
                {/* Field Name */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Field Name <small className="text-muted">(Firebase Key)</small>
                    <span className="text-danger ms-1">*</span>
                  </Form.Label>
                  {isNew ? (
                    <>
                      <Form.Control
                        type="text"
                        value={newFieldName}
                        onChange={(e) => {
                          setNewFieldName(e.target.value)
                          setFieldNameError('')
                        }}
                        placeholder="e.g., bloodGroup"
                        isInvalid={!!fieldNameError}
                      />
                      <Form.Control.Feedback type="invalid">{fieldNameError}</Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        This becomes the Firestore document key. Cannot be changed later.
                      </Form.Text>
                    </>
                  ) : (
                    <Form.Control type="text" value={fieldKey} disabled className="bg-light" />
                  )}
                </Form.Group>

                {/* Display Name */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Display Name <span className="text-danger ms-1">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    placeholder="e.g., Blood Group"
                  />
                </Form.Group>

                {/* Type */}
                <Form.Group className="mb-3">
                  <Form.Label>Field Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    {FIELD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.firebaseType}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Firebase stores as: <strong>{firebaseType}</strong>
                    {formData.type === 'list' && ' — renders as tag input (comma-separated values)'}
                    {formData.type === 'checkbox' && ' — renders as a toggle switch'}
                    {formData.type === 'richtext' && ' — renders as rich text editor'}
                    {formData.type === 'date' && ' — renders as date picker'}
                  </Form.Text>
                </Form.Group>

                <Row>
                  {/* Column Size */}
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Column Width</Form.Label>
                      <Form.Select
                        name="colSize"
                        value={formData.colSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, colSize: Number(e.target.value) }))}
                      >
                        {COL_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Rows */}
                  {formData.type === 'textarea' && (
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Rows</Form.Label>
                        <Form.Control
                          type="number"
                          name="rows"
                          min={1}
                          max={10}
                          value={formData.rows}
                          onChange={(e) => setFormData(prev => ({ ...prev, rows: parseInt(e.target.value) || 3 }))}
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                {/* Placeholder */}
                <Form.Group className="mb-3">
                  <Form.Label>Placeholder</Form.Label>
                  <Form.Control
                    type="text"
                    name="placeholder"
                    value={formData.placeholder}
                    onChange={handleChange}
                    placeholder="Shown when field is empty..."
                  />
                </Form.Group>

                {/* Visible & Required */}
                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="visible-switch"
                        label="Visible"
                        checked={formData.visible}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          visible: e.target.checked,
                          required: e.target.checked ? prev.required : false,
                        }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="required-switch"
                        label="Required"
                        checked={formData.required}
                        onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                        disabled={!formData.visible}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
            <Card.Footer className="entity-form-footer d-flex justify-content-between flex-wrap gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/settings')}
              >
                <FaArrowLeft className="me-2" /> Back
              </Button>
              <Button
                className="btn-theme"
                onClick={handleSave}
                disabled={saving || !formData.label.trim() || (isNew && !newFieldName.trim())}
              >
                {saving ? 'Saving...' : (isNew ? 'Add Field' : 'Save Changes')}
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        {/* Preview Card */}
        <Col xs={12} lg={4} className="mt-3 mt-lg-0">
          <Card className="shadow-sm">
            <Card.Header className="bg-theme-light text-white">
              <h5 className="mb-0 fs-responsive-md">Preview</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>Firebase Key:</strong>{' '}
                <code style={{ color: '#0891B2' }}>{isNew ? (newFieldName || '—') : fieldKey}</code>
              </div>
              <div className="mb-2">
                <strong>Display:</strong> {formData.label || '—'}
              </div>
              <div className="mb-2">
                <strong>Type:</strong> {FIELD_TYPE_OPTIONS.find(o => o.value === formData.type)?.label || formData.type}
              </div>
              <div className="mb-2">
                <strong>Firebase Type:</strong> <code>{firebaseType}</code>
              </div>
              <div className="mb-2">
                <strong>Width:</strong> {formData.colSize === 12 ? 'Full' : 'Half'}
              </div>
              <div className="mb-2">
                <strong>Visible:</strong> {formData.visible ? 'Yes' : 'No'}
              </div>
              <div className="mb-2">
                <strong>Required:</strong> {formData.required ? 'Yes' : 'No'}
              </div>
              {formData.placeholder && (
                <div className="mb-2">
                  <strong>Placeholder:</strong> {formData.placeholder}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default FieldSettingDetail
