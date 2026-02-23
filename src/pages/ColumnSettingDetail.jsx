import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'
import { FaCog, FaArrowLeft } from 'react-icons/fa'
import { updateSettings } from '../store/settingsSlice'
import { useSettings } from '../hooks'
import { ENTITY_LABELS, FIELD_TYPE_OPTIONS, COL_SIZE_OPTIONS } from '../constants/defaultSettings'
import { useNotification } from '../context'

function ColumnSettingDetail() {
  const { entity, columnKey } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { settings } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { success, error: showError } = useNotification()

  const isNew = columnKey === 'new'
  const existing = !isNew ? settings?.tables?.[entity]?.columns?.[columnKey] : null

  const existingField = !isNew ? settings?.forms?.[entity]?.fields?.[columnKey] : null

  const [label, setLabel] = useState('')
  const [visible, setVisible] = useState(true)
  const [newKey, setNewKey] = useState('')
  const [keyError, setKeyError] = useState('')
  const [saving, setSaving] = useState(false)
  const [fieldType, setFieldType] = useState('text')
  const [required, setRequired] = useState(false)
  const [colSize, setColSize] = useState(6)
  const [placeholder, setPlaceholder] = useState('')

  // Load existing data
  useEffect(() => {
    if (existing) {
      setLabel(existing.label || '')
      setVisible(existing.visible !== false)
    }
  }, [existing?.label, existing?.visible]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing form field data
  useEffect(() => {
    if (existingField) {
      setFieldType(existingField.type || 'text')
      setRequired(existingField.required === true)
      setColSize(existingField.colSize ?? 6)
      setPlaceholder(existingField.placeholder || '')
    }
  }, [existingField?.type, existingField?.required, existingField?.colSize, existingField?.placeholder]) // eslint-disable-line react-hooks/exhaustive-deps

  const validateKey = useCallback((name) => {
    if (!name.trim()) return 'Column key is required'
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) return 'Letters, numbers, underscore only. Must start with a letter.'
    const cols = settings?.tables?.[entity]?.columns
    if (cols && cols[name]) return 'This column key already exists'
    return ''
  }, [settings, entity])

  const handleSave = async () => {
    const key = isNew ? newKey.trim() : columnKey

    if (isNew) {
      const error = validateKey(key)
      if (error) {
        setKeyError(error)
        return
      }
    }

    setSaving(true)
    try {
      await dispatch(updateSettings({
        data: {
          tables: {
            [entity]: {
              columns: {
                [key]: { label, visible },
              },
            },
          },
          forms: {
            [entity]: {
              fields: {
                [key]: {
                  label,
                  type: fieldType,
                  visible,
                  required: visible ? required : false,
                  colSize: Number(colSize),
                  placeholder,
                },
              },
            },
          },
        },
        user,
      }))

      success(isNew ? 'Column & form field added successfully!' : 'Column & form field updated successfully!')
      navigate('/settings')
    } catch (err) {
      showError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Not found
  if (!isNew && !existing && settings?.tables?.[entity]) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Column not found</h4>
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
            {isNew ? 'Add New Column' : 'Edit Column'}
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
                {isNew ? 'New Column Configuration' : `Column: ${columnKey}`}
              </h5>
            </Card.Header>
            <Card.Body className="entity-form-body">
              <Form>
                {/* Column Key */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Column Key <small className="text-muted">(Firebase Field)</small>
                    <span className="text-danger ms-1">*</span>
                  </Form.Label>
                  {isNew ? (
                    <>
                      <Form.Control
                        type="text"
                        value={newKey}
                        onChange={(e) => {
                          setNewKey(e.target.value)
                          setKeyError('')
                        }}
                        placeholder="e.g., bloodGroup"
                        isInvalid={!!keyError}
                      />
                      <Form.Control.Feedback type="invalid">{keyError}</Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Must match the Firestore document field name. Cannot be changed later.
                      </Form.Text>
                    </>
                  ) : (
                    <Form.Control type="text" value={columnKey} disabled className="bg-light" />
                  )}
                </Form.Group>

                {/* Display Name */}
                <Form.Group className="mb-3">
                  <Form.Label>Display Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Column header text..."
                  />
                </Form.Group>

                {/* Visible */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="col-visible-switch"
                    label="Visible"
                    checked={visible}
                    onChange={(e) => {
                      setVisible(e.target.checked)
                      if (!e.target.checked) setRequired(false)
                    }}
                  />
                </Form.Group>

                <hr />
                <h6 className="text-muted mb-3">Form Field Settings</h6>

                {/* Field Type */}
                <Form.Group className="mb-3">
                  <Form.Label>Field Type</Form.Label>
                  <Form.Select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                  >
                    {FIELD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.firebaseType}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  {/* Column Width */}
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Column Width</Form.Label>
                      <Form.Select
                        value={colSize}
                        onChange={(e) => setColSize(Number(e.target.value))}
                      >
                        {COL_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {/* Required */}
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3 mt-md-4">
                      <Form.Check
                        type="switch"
                        id="required-switch"
                        label="Required"
                        checked={required}
                        onChange={(e) => setRequired(e.target.checked)}
                        disabled={!visible}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Placeholder */}
                <Form.Group className="mb-3">
                  <Form.Label>Placeholder</Form.Label>
                  <Form.Control
                    type="text"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder="Shown when field is empty..."
                  />
                </Form.Group>
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
                disabled={saving || (isNew && !newKey.trim())}
              >
                {saving ? 'Saving...' : (isNew ? 'Add Column' : 'Save Changes')}
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
                <code style={{ color: '#0891B2' }}>{isNew ? (newKey || '—') : columnKey}</code>
              </div>
              <div className="mb-2">
                <strong>Header:</strong> {label || '—'}
              </div>
              <div className="mb-2">
                <strong>Visible:</strong> {visible ? 'Yes' : 'No'}
              </div>
              <hr />
              <small className="text-muted d-block mb-2">Form Field</small>
              <div className="mb-2">
                <strong>Type:</strong> {FIELD_TYPE_OPTIONS.find(o => o.value === fieldType)?.label || fieldType}
              </div>
              <div className="mb-2">
                <strong>Width:</strong> {colSize === 12 ? 'Full' : 'Half'}
              </div>
              <div className="mb-2">
                <strong>Required:</strong> {required ? 'Yes' : 'No'}
              </div>
              {placeholder && (
                <div className="mb-2">
                  <strong>Placeholder:</strong> {placeholder}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ColumnSettingDetail
