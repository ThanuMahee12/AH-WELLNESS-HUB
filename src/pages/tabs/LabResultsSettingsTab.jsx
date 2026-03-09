import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Row, Col, Card, Table, Form, Button, Badge } from 'react-bootstrap'
import { FaPlus, FaTrash, FaFilePdf, FaStethoscope, FaVial } from 'react-icons/fa'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function CheckupSettingsTab() {
  const dispatch = useDispatch()
  const { settings, loading } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { error: showError } = useNotification()

  // New field state for both sections
  const [newLabFieldKey, setNewLabFieldKey] = useState('')
  const [newLabFieldLabel, setNewLabFieldLabel] = useState('')
  const [newLabFieldParent, setNewLabFieldParent] = useState('')
  const [newGenFieldKey, setNewGenFieldKey] = useState('')
  const [newGenFieldLabel, setNewGenFieldLabel] = useState('')
  const [newGenFieldParent, setNewGenFieldParent] = useState('')

  // PDF settings
  const invoicePdf = settings?.checkupPdf?.invoice || { format: 'a5', width: 148, height: 210, orientation: 'portrait' }
  const prescriptionPdf = settings?.checkupPdf?.prescription || { format: 'a5', width: 148, height: 210, orientation: 'portrait' }

  // Lab Results
  const labFields = settings?.labResults?.fields || {}
  const labShowEmpty = settings?.labResults?.showEmpty ?? 'hide'
  const sortedLabFields = Object.entries(labFields).sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
  const labParentOptions = sortedLabFields.filter(([, cfg]) => !cfg.parent)

  // General Tests
  const genFields = settings?.generalTests?.fields || {}
  const genShowEmpty = settings?.generalTests?.showEmpty ?? 'hide'
  const sortedGenFields = Object.entries(genFields).sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
  const genParentOptions = sortedGenFields.filter(([, cfg]) => !cfg.parent)

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateSettings({ data, user })).unwrap()
    } catch (err) {
      showError('Failed to update: ' + (err || 'Unknown error'))
    }
  }

  const PDF_PRESETS = {
    a4: { width: 210, height: 297, orientation: 'portrait' },
    a5: { width: 148, height: 210, orientation: 'portrait' },
    letter: { width: 215.9, height: 279.4, orientation: 'portrait' },
    thermal80: { width: 80, height: 200, orientation: 'portrait' },
    thermal58: { width: 58, height: 150, orientation: 'portrait' },
  }

  const handlePdfChange = (type, field, value) => {
    if (field === 'format' && value !== 'custom') {
      handleUpdate({ checkupPdf: { [type]: { format: value, ...PDF_PRESETS[value] } } })
    } else {
      handleUpdate({ checkupPdf: { [type]: { [field]: field === 'width' || field === 'height' ? parseFloat(value) : value } } })
    }
  }

  // Generic field handlers - settingsKey is 'labResults' or 'generalTests'
  const handleShowEmptyToggle = (settingsKey, value) => {
    handleUpdate({ [settingsKey]: { showEmpty: value } })
  }

  const handleToggleVisible = (settingsKey, fieldKey, value) => {
    handleUpdate({ [settingsKey]: { fields: { [fieldKey]: { visible: value } } } })
  }

  const handleLabelChange = (settingsKey, fieldKey, label) => {
    handleUpdate({ [settingsKey]: { fields: { [fieldKey]: { label } } } })
  }

  const handleOrderChange = (settingsKey, fieldKey, value) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) return
    handleUpdate({ [settingsKey]: { fields: { [fieldKey]: { order: num } } } })
  }

  const handleDisplayChange = (settingsKey, fieldKey, value) => {
    handleUpdate({ [settingsKey]: { fields: { [fieldKey]: { display: value } } } })
  }

  const handleParentChange = (settingsKey, fields, fieldKey, newParent) => {
    const currentCfg = fields[fieldKey]
    const oldParent = currentCfg?.parent
    const fieldUpdates = { [fieldKey]: { parent: newParent || null } }

    if (oldParent && fields[oldParent]?.children) {
      const oldChildren = fields[oldParent].children.filter(c => c !== fieldKey)
      fieldUpdates[oldParent] = { children: oldChildren.length > 0 ? oldChildren : null }
    }

    if (newParent && fields[newParent]) {
      const existing = fields[newParent].children || []
      if (!existing.includes(fieldKey)) {
        fieldUpdates[newParent] = { ...(fieldUpdates[newParent] || {}), children: [...existing, fieldKey] }
      }
    }

    handleUpdate({ [settingsKey]: { fields: fieldUpdates } })
  }

  const handleAddField = async (settingsKey, fields, sortedFields, key, label, parent, resetFn) => {
    const cleanKey = key.trim().replace(/\s+/g, '')
    const cleanLabel = label.trim()
    if (!cleanKey || !cleanLabel) return
    if (fields[cleanKey]) {
      showError(`Field "${cleanKey}" already exists`)
      return
    }
    const maxOrder = sortedFields.length > 0 ? Math.max(...sortedFields.map(([, c]) => c.order || 0)) : 0
    const newField = { label: cleanLabel, visible: true, order: maxOrder + 1 }
    const fieldUpdates = { [cleanKey]: newField }

    if (parent && fields[parent]) {
      newField.parent = parent
      const existing = fields[parent].children || []
      fieldUpdates[parent] = { children: [...existing, cleanKey] }
    }

    try {
      await dispatch(updateSettings({ data: { [settingsKey]: { fields: fieldUpdates } }, user })).unwrap()
      resetFn()
    } catch (err) {
      showError('Failed to add field: ' + (err || 'Unknown error'))
    }
  }

  const handleDeleteField = async (settingsKey, fields, fieldKey) => {
    if (!window.confirm(`Delete field "${fieldKey}"?`)) return
    try {
      const cfg = fields[fieldKey]
      const updated = { ...fields }

      if (cfg.children) {
        cfg.children.forEach(ck => {
          if (updated[ck]) updated[ck] = { ...updated[ck], parent: null }
        })
      }

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
        data: { [settingsKey]: { fields: updated } },
        user,
        replace: [`${settingsKey}.fields`],
      })).unwrap()
    } catch (err) {
      showError('Failed to delete field: ' + (err || 'Unknown error'))
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading settings..." />
  }

  const renderPdfRow = (type, label, pdf) => (
    <Row className="align-items-end mb-3">
      <Col xs={12}>
        <h6 className="text-theme mb-2">{label}</h6>
      </Col>
      <Col xs={6} md={3}>
        <Form.Group>
          <Form.Label style={{ fontSize: '0.8rem' }}>Page Format</Form.Label>
          <Form.Select size="sm" value={pdf.format} onChange={(e) => handlePdfChange(type, 'format', e.target.value)}>
            <option value="a4">A4</option>
            <option value="a5">A5</option>
            <option value="letter">Letter</option>
            <option value="thermal80">Thermal 80mm</option>
            <option value="thermal58">Thermal 58mm</option>
            <option value="custom">Custom</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col xs={3} md={2}>
        <Form.Group>
          <Form.Label style={{ fontSize: '0.8rem' }}>Width (mm)</Form.Label>
          <Form.Control size="sm" type="number" value={pdf.width} onChange={(e) => handlePdfChange(type, 'width', e.target.value)} disabled={pdf.format !== 'custom'} />
        </Form.Group>
      </Col>
      <Col xs={3} md={2}>
        <Form.Group>
          <Form.Label style={{ fontSize: '0.8rem' }}>Height (mm)</Form.Label>
          <Form.Control size="sm" type="number" value={pdf.height} onChange={(e) => handlePdfChange(type, 'height', e.target.value)} disabled={pdf.format !== 'custom'} />
        </Form.Group>
      </Col>
      <Col xs={6} md={2}>
        <Form.Group>
          <Form.Label style={{ fontSize: '0.8rem' }}>Orientation</Form.Label>
          <Form.Select size="sm" value={pdf.orientation} onChange={(e) => handlePdfChange(type, 'orientation', e.target.value)}>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col xs={6} md={3}>
        <div style={{ fontSize: '0.8rem', color: '#64748b', paddingBottom: '0.4rem' }}>
          <strong>Current:</strong> {pdf.width} x {pdf.height} mm ({pdf.orientation})
        </div>
      </Col>
    </Row>
  )

  // Reusable fields table
  const renderFieldsTable = (settingsKey, title, icon, fields, sortedFields, parentOptions, showEmpty, newKey, newLabel, newParent, setNewKey, setNewLabel, setNewParent) => (
    <>
      {/* Display setting */}
      <Col xs={12}>
        <Card className="shadow-sm">
          <Card.Header className="card-header-theme">
            <h5 className="mb-0 fs-responsive-md">{icon} {title}</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label className="fw-semibold" style={{ fontSize: '0.9rem' }}>Default empty field behaviour</Form.Label>
              <Form.Select
                value={showEmpty}
                onChange={(e) => handleShowEmptyToggle(settingsKey, e.target.value)}
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
            <h5 className="mb-0 fs-responsive-md">{title} Fields</h5>
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
                          <div><Badge bg="light" text="dark" style={{ fontSize: '0.65rem' }}>parent</Badge></div>
                        )}
                        {cfg.parent && (
                          <div><Badge bg="secondary" style={{ fontSize: '0.65rem' }}>child of {cfg.parent}</Badge></div>
                        )}
                      </td>
                      <td data-label="Label">
                        <Form.Control
                          size="sm"
                          type="text"
                          defaultValue={cfg.label || key}
                          onBlur={(e) => {
                            const val = e.target.value.trim()
                            if (val && val !== (cfg.label || key)) handleLabelChange(settingsKey, key, val)
                          }}
                        />
                      </td>
                      <td data-label="Order" style={{ textAlign: 'center' }}>
                        <Form.Control
                          size="sm"
                          type="number"
                          defaultValue={cfg.order || 0}
                          onBlur={(e) => handleOrderChange(settingsKey, key, e.target.value)}
                          style={{ maxWidth: '70px', margin: '0 auto' }}
                        />
                      </td>
                      <td data-label="Group Under">
                        <Form.Select
                          size="sm"
                          value={cfg.parent || ''}
                          onChange={(e) => handleParentChange(settingsKey, fields, key, e.target.value)}
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
                          onChange={(e) => handleDisplayChange(settingsKey, key, e.target.value)}
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
                          onChange={(e) => handleToggleVisible(settingsKey, key, e.target.checked)}
                          className="d-inline-block"
                        />
                      </td>
                      <td data-label="Delete" style={{ textAlign: 'center' }}>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteField(settingsKey, fields, key)}
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
                      <Form.Control size="sm" type="text" placeholder="key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
                    </td>
                    <td data-label="Label">
                      <Form.Control size="sm" type="text" placeholder="Display Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                    </td>
                    <td />
                    <td data-label="Group Under">
                      <Form.Select size="sm" value={newParent} onChange={(e) => setNewParent(e.target.value)}>
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
                        onClick={() => handleAddField(settingsKey, fields, sortedFields, newKey, newLabel, newParent, () => { setNewKey(''); setNewLabel(''); setNewParent('') })}
                        disabled={!newKey.trim() || !newLabel.trim()}
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
    </>
  )

  return (
    <Row className="g-3">
      {/* PDF Settings */}
      <Col xs={12}>
        <Card className="shadow-sm">
          <Card.Header className="card-header-theme">
            <h5 className="mb-0 fs-responsive-md"><FaFilePdf className="me-2" />PDF Settings</h5>
          </Card.Header>
          <Card.Body>
            {renderPdfRow('invoice', 'Invoice', invoicePdf)}
            <hr />
            {renderPdfRow('prescription', 'Prescription', prescriptionPdf)}
          </Card.Body>
        </Card>
      </Col>

      {/* General Tests */}
      {renderFieldsTable(
        'generalTests', 'General Tests', <FaStethoscope className="me-2" />,
        genFields, sortedGenFields, genParentOptions, genShowEmpty,
        newGenFieldKey, newGenFieldLabel, newGenFieldParent,
        setNewGenFieldKey, setNewGenFieldLabel, setNewGenFieldParent
      )}

      {/* Lab Results */}
      {renderFieldsTable(
        'labResults', 'Lab Results', <FaVial className="me-2" />,
        labFields, sortedLabFields, labParentOptions, labShowEmpty,
        newLabFieldKey, newLabFieldLabel, newLabFieldParent,
        setNewLabFieldKey, setNewLabFieldLabel, setNewLabFieldParent
      )}
    </Row>
  )
}

export default CheckupSettingsTab
