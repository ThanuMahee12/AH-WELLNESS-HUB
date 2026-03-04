import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'
import { FaCog } from 'react-icons/fa'
import { Breadcrumb } from '../components/ui'
import { updateSettings } from '../store/settingsSlice'
import { useSettings } from '../hooks'
import { ENTITY_LABELS, FIELD_TYPE_OPTIONS, COL_SIZE_OPTIONS, ALL_ROLES } from '../constants/defaultSettings'
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
  const [roles, setRoles] = useState([...ALL_ROLES])
  const [searchable, setSearchable] = useState(true)

  // Load existing data
  useEffect(() => {
    if (existing) {
      setLabel(existing.label || '')
      setVisible(existing.visible !== false)
      if (existing.roles) setRoles(existing.roles)
      setSearchable(existing.searchable !== false)
    }
  }, [existing?.label, existing?.visible, existing?.searchable]) // eslint-disable-line react-hooks/exhaustive-deps

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
                [key]: { label, visible, roles, searchable },
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
        <Breadcrumb
          items={[{ label: 'Settings', path: '/settings' }]}
          current="Not Found"
        />
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Column not found</h4>
            <p className="text-muted">The column you're looking for doesn't exist or has been removed.</p>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <Breadcrumb
        items={[{ label: 'Settings', path: '/settings' }]}
        current={isNew ? 'New Column' : (columnKey || 'Edit Column')}
      />

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

                {/* Searchable */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="col-searchable-switch"
                    label="Searchable"
                    checked={searchable}
                    onChange={(e) => setSearchable(e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Include this column in table search results
                  </Form.Text>
                </Form.Group>

                {/* Roles */}
                <Form.Group className="mb-3">
                  <Form.Label>Visible to Roles</Form.Label>
                  <div className="d-flex flex-wrap gap-3">
                    {ALL_ROLES.map((role) => (
                      <Form.Check
                        key={role}
                        type="checkbox"
                        id={`role-${role}`}
                        label={role}
                        checked={roles.includes(role)}
                        onChange={(e) => {
                          setRoles(prev =>
                            e.target.checked
                              ? [...prev, role]
                              : prev.filter(r => r !== role)
                          )
                        }}
                      />
                    ))}
                  </div>
                  <Form.Text className="text-muted">
                    Only selected roles will see this column
                  </Form.Text>
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
            <Card.Footer className="entity-form-footer justify-content-end">
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
              <div className="mb-2">
                <strong>Searchable:</strong> {searchable ? 'Yes' : 'No'}
              </div>
              <div className="mb-2">
                <strong>Roles:</strong>{' '}
                {roles.length > 0
                  ? roles.map(r => (
                      <span key={r} className="badge bg-info text-dark me-1" style={{ fontSize: '0.7rem' }}>{r}</span>
                    ))
                  : <span className="text-muted">None</span>
                }
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
