import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Row, Col, Card, Table, Form, Button, Badge } from 'react-bootstrap'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function LabResultsSettingsTab() {
  const dispatch = useDispatch()
  const { settings, loading } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { error: showError } = useNotification()

  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldParent, setNewFieldParent] = useState('')

  const fields = settings?.labResults?.fields || {}
  const showEmpty = settings?.labResults?.showEmpty ?? false
  const sortedFields = Object.entries(fields).sort((a, b) => (a[1].order || 0) - (b[1].order || 0))

  // Get parent-capable fields (those without a parent themselves)
  const parentOptions = sortedFields.filter(([, cfg]) => !cfg.parent)

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateSettings({ data, user })).unwrap()
    } catch (err) {
      showError('Failed to update: ' + (err || 'Unknown error'))
    }
  }

  const handleShowEmptyToggle = (value) => {
    handleUpdate({ labResults: { showEmpty: value } })
  }

  const handleToggleVisible = (fieldKey, value) => {
    const update = { labResults: { fields: { [fieldKey]: { visible: value } } } }
    handleUpdate(update)
  }

  const handleLabelChange = (fieldKey, label) => {
    handleUpdate({ labResults: { fields: { [fieldKey]: { label } } } })
  }

  const handleOrderChange = (fieldKey, value) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) return
    handleUpdate({ labResults: { fields: { [fieldKey]: { order: num } } } })
  }

  const handleParentChange = async (fieldKey, newParent) => {
    const currentCfg = fields[fieldKey]
    const oldParent = currentCfg?.parent

    // Build batch update
    const fieldUpdates = { [fieldKey]: { parent: newParent || null } }

    // Remove from old parent's children
    if (oldParent && fields[oldParent]?.children) {
      const oldChildren = fields[oldParent].children.filter(c => c !== fieldKey)
      fieldUpdates[oldParent] = { children: oldChildren.length > 0 ? oldChildren : null }
    }

    // Add to new parent's children
    if (newParent && fields[newParent]) {
      const existing = fields[newParent].children || []
      if (!existing.includes(fieldKey)) {
        fieldUpdates[newParent] = { ...(fieldUpdates[newParent] || {}), children: [...existing, fieldKey] }
      }
    }

    handleUpdate({ labResults: { fields: fieldUpdates } })
  }

  const handleAddField = async () => {
    const key = newFieldKey.trim().replace(/\s+/g, '')
    const label = newFieldLabel.trim()
    if (!key || !label) return
    if (fields[key]) {
      showError(`Field "${key}" already exists`)
      return
    }
    const maxOrder = sortedFields.length > 0 ? Math.max(...sortedFields.map(([, c]) => c.order || 0)) : 0
    const newField = { label, visible: true, order: maxOrder + 1 }
    const fieldUpdates = { [key]: newField }

    // If a parent is selected, wire up parent/children
    if (newFieldParent && fields[newFieldParent]) {
      newField.parent = newFieldParent
      const existing = fields[newFieldParent].children || []
      fieldUpdates[newFieldParent] = { children: [...existing, key] }
    }

    try {
      await dispatch(updateSettings({
        data: { labResults: { fields: fieldUpdates } },
        user,
      })).unwrap()
      setNewFieldKey('')
      setNewFieldLabel('')
      setNewFieldParent('')
    } catch (err) {
      showError('Failed to add field: ' + (err || 'Unknown error'))
    }
  }

  const handleDeleteField = async (fieldKey) => {
    if (!window.confirm(`Delete lab result field "${fieldKey}"?`)) return
    try {
      const cfg = fields[fieldKey]
      const updated = { ...fields }

      // If deleting a parent, unset parent on all children
      if (cfg.children) {
        cfg.children.forEach(ck => {
          if (updated[ck]) updated[ck] = { ...updated[ck], parent: null }
        })
      }

      // If deleting a child, remove from parent's children array
      if (cfg.parent && updated[cfg.parent]?.children) {
        updated[cfg.parent] = {
          ...updated[cfg.parent],
          children: updated[cfg.parent].children.filter(c => c !== fieldKey),
        }
        if (updated[cfg.parent].children.length === 0) {
          updated[cfg.parent] = { ...updated[cfg.parent], children: null }
        }
      }

      delete updated[fieldKey]
      await dispatch(updateSettings({
        data: { labResults: { fields: updated } },
        user,
        replace: ['labResults.fields'],
      })).unwrap()
    } catch (err) {
      showError('Failed to delete field: ' + (err || 'Unknown error'))
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading settings..." />
  }

  return (
    <Row className="g-3">
      {/* Global display setting */}
      <Col xs={12}>
        <Card className="shadow-sm">
          <Card.Header className="card-header-theme">
            <h5 className="mb-0 fs-responsive-md">Display Settings</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label className="fw-semibold" style={{ fontSize: '0.9rem' }}>Default empty field behaviour</Form.Label>
              <Form.Select
                value={showEmpty}
                onChange={(e) => handleShowEmptyToggle(e.target.value)}
                style={{ maxWidth: '350px' }}
              >
                <option value="hide">Hide empty fields</option>
                <option value="show">Show empty fields (blank)</option>
                <option value="na">Show empty fields with N/A</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Each field can override this with its own Display setting below.
              </Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>
      </Col>

      {/* Fields table */}
      <Col xs={12}>
        <Card className="shadow-sm">
          <Card.Header className="card-header-theme d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fs-responsive-md">Lab Result Fields</h5>
            <Badge bg="info">{sortedFields.length} fields</Badge>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 table-mobile-responsive align-middle">
                <thead className="bg-theme-slate">
                  <tr>
                    <th style={{ width: '10%' }}>Key</th>
                    <th style={{ width: '16%' }}>Label</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Order</th>
                    <th style={{ width: '15%' }}>Group Under</th>
                    <th style={{ width: '15%' }}>Display</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Visible</th>
                    <th style={{ width: '6%', textAlign: 'center' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFields.map(([key, cfg]) => (
                    <tr key={key} style={{ opacity: cfg.visible === false ? 0.5 : 1 }}>
                      <td data-label="Key">
                        <strong className="text-theme">{key}</strong>
                        {cfg.children && (
                          <div>
                            <Badge bg="light" text="dark" style={{ fontSize: '0.65rem' }}>
                              parent
                            </Badge>
                          </div>
                        )}
                        {cfg.parent && (
                          <div>
                            <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>
                              child of {cfg.parent}
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td data-label="Label">
                        <Form.Control
                          size="sm"
                          type="text"
                          defaultValue={cfg.label || key}
                          onBlur={(e) => {
                            const val = e.target.value.trim()
                            if (val && val !== (cfg.label || key)) handleLabelChange(key, val)
                          }}
                        />
                      </td>
                      <td data-label="Order" style={{ textAlign: 'center' }}>
                        <Form.Control
                          size="sm"
                          type="number"
                          defaultValue={cfg.order || 0}
                          onBlur={(e) => handleOrderChange(key, e.target.value)}
                          style={{ maxWidth: '70px', margin: '0 auto' }}
                        />
                      </td>
                      <td data-label="Group Under">
                        <Form.Select
                          size="sm"
                          value={cfg.parent || ''}
                          onChange={(e) => handleParentChange(key, e.target.value)}
                          disabled={!!cfg.children}
                        >
                          <option value="">— None —</option>
                          {parentOptions
                            .filter(([k]) => k !== key)
                            .map(([k, c]) => (
                              <option key={k} value={k}>{c.label || k}</option>
                            ))
                          }
                        </Form.Select>
                      </td>
                      <td data-label="Display">
                        <Form.Select
                          size="sm"
                          value={cfg.display || 'default'}
                          onChange={(e) => handleUpdate({ labResults: { fields: { [key]: { display: e.target.value } } } })}
                        >
                          <option value="default">Default</option>
                          <option value="always">Always (N/A)</option>
                          <option value="valueOnly">Only with value</option>
                        </Form.Select>
                      </td>
                      <td data-label="Visible" style={{ textAlign: 'center' }}>
                        <Form.Check
                          type="switch"
                          checked={cfg.visible !== false}
                          onChange={(e) => handleToggleVisible(key, e.target.checked)}
                          className="d-inline-block"
                        />
                      </td>
                      <td data-label="Delete" style={{ textAlign: 'center' }}>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteField(key)}
                          title="Delete field"
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {/* Add new field row */}
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td data-label="Key">
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="key"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                      />
                    </td>
                    <td data-label="Label">
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="Display Label"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                      />
                    </td>
                    <td />
                    <td data-label="Group Under">
                      <Form.Select
                        size="sm"
                        value={newFieldParent}
                        onChange={(e) => setNewFieldParent(e.target.value)}
                      >
                        <option value="">— None —</option>
                        {parentOptions.map(([k, c]) => (
                          <option key={k} value={k}>{c.label || k}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td />
                    <td />
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        size="sm"
                        className="btn-theme-add"
                        onClick={handleAddField}
                        disabled={!newFieldKey.trim() || !newFieldLabel.trim()}
                        title="Add field"
                      >
                        <FaPlus />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default LabResultsSettingsTab
