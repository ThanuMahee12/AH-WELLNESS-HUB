import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Row, Col, Card, Table, Form, Button, Badge } from 'react-bootstrap'
import { FaPlus, FaTrash, FaFilePdf, FaStethoscope, FaVial, FaChevronDown, FaChevronRight, FaEdit, FaSave, FaTimes, FaAddressCard, FaSignature } from 'react-icons/fa'
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

  // Rules expand state
  const [expandedRules, setExpandedRules] = useState({})
  const [newRule, setNewRule] = useState({})
  const [editingRule, setEditingRule] = useState(null) // { id, index, ...ruleData }

  const toggleRules = (settingsKey, fieldKey) => {
    const id = `${settingsKey}.${fieldKey}`
    setExpandedRules(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const buildRule = (r) => {
    const rule = { operator: r.operator, label: r.label.trim(), display: r.display }
    if (r.operator === 'between') {
      rule.min = parseFloat(r.min)
      rule.max = parseFloat(r.max)
    } else {
      rule.value = parseFloat(r.value)
    }
    return rule
  }

  const isRuleValid = (r) => {
    if (!r || !r.operator || !r.label?.trim() || !r.display) return false
    if (r.operator === 'between') return r.min !== '' && r.min !== undefined && r.max !== '' && r.max !== undefined && !isNaN(r.min) && !isNaN(r.max)
    return r.value !== '' && r.value !== undefined && !isNaN(r.value)
  }

  const saveRules = async (settingsKey, fieldKey, updatedRules) => {
    try {
      await dispatch(updateSettings({
        data: { [settingsKey]: { fields: { [fieldKey]: { rules: updatedRules } } } },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to save rules: ' + (err || 'Unknown error'))
    }
  }

  const handleAddRule = (settingsKey, fieldKey, rules) => {
    const r = newRule[`${settingsKey}.${fieldKey}`] || {}
    if (!isRuleValid(r)) return
    const updated = [...(rules || []), buildRule(r)]
    saveRules(settingsKey, fieldKey, updated)
    setNewRule(prev => ({ ...prev, [`${settingsKey}.${fieldKey}`]: {} }))
  }

  const handleEditRule = (settingsKey, fieldKey, rules, index) => {
    const r = editingRule
    if (!r || !isRuleValid(r)) return
    const updated = rules.map((rule, i) => i === index ? buildRule(r) : rule)
    saveRules(settingsKey, fieldKey, updated)
    setEditingRule(null)
  }

  const handleDeleteRule = (settingsKey, fieldKey, rules, index) => {
    const updated = rules.filter((_, i) => i !== index)
    saveRules(settingsKey, fieldKey, updated)
    if (editingRule?.index === index) setEditingRule(null)
  }

  const DISPLAY_OPTIONS = [
    { value: '*', label: '*' },
    { value: 'B', label: 'B' },
    { value: 'I', label: 'I' },
    { value: 'U', label: 'U' },
    { value: 'IB', label: 'IB' },
    { value: 'UB', label: 'UB' },
    { value: 'IU', label: 'IU' },
  ]

  const OPERATORS = [
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '>=', label: '>=' },
    { value: '<=', label: '<=' },
    { value: '==', label: '==' },
    { value: 'between', label: 'Between' },
  ]

  // PDF settings
  const invoicePdf = settings?.checkupPdf?.invoice || { format: 'a5', width: 148, height: 210, orientation: 'portrait' }
  const prescriptionPdf = settings?.checkupPdf?.prescription || { format: 'a5', width: 148, height: 210, orientation: 'portrait' }
  const footerSettings = settings?.checkupPdf?.footer || {}
  const savedESign = settings?.checkupPdf?.eSign || ''
  const sigCanvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0]
    const clientX = touch ? touch.clientX : e.clientX
    const clientY = touch ? touch.clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = useCallback((e) => {
    const canvas = sigCanvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
  }, [])

  const draw = useCallback((e) => {
    if (!isDrawing) return
    const canvas = sigCanvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#333'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasStrokes(true)
  }, [isDrawing])

  const stopDraw = useCallback(() => setIsDrawing(false), [])

  const clearCanvas = () => {
    const canvas = sigCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
  }

  const saveSignature = () => {
    const canvas = sigCanvasRef.current
    if (!canvas || !hasStrokes) return
    // Trim transparent pixels
    const ctx = canvas.getContext('2d')
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const { data, width, height } = imgData
    let top = height, left = width, right = 0, bottom = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 0) {
          if (y < top) top = y
          if (y > bottom) bottom = y
          if (x < left) left = x
          if (x > right) right = x
        }
      }
    }
    const pad = 4
    top = Math.max(0, top - pad)
    left = Math.max(0, left - pad)
    right = Math.min(width - 1, right + pad)
    bottom = Math.min(height - 1, bottom + pad)
    const trimmed = document.createElement('canvas')
    trimmed.width = right - left + 1
    trimmed.height = bottom - top + 1
    trimmed.getContext('2d').putImageData(ctx.getImageData(left, top, trimmed.width, trimmed.height), 0, 0)
    const dataUrl = trimmed.toDataURL('image/png')
    handleUpdate({ checkupPdf: { eSign: dataUrl } })
    clearCanvas()
  }

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
                  {sortedFields.map(([key, cfg]) => {
                    const rulesId = `${settingsKey}.${key}`
                    const isExpanded = expandedRules[rulesId]
                    const fieldRules = cfg.rules || []
                    const nr = newRule[rulesId] || {}
                    return (
                    <React.Fragment key={key}>
                    <tr style={{ opacity: cfg.visible === false ? 0.5 : 1 }}>
                      <td data-label="Key">
                        <strong className="text-theme">{key}</strong>
                        {cfg.children && (
                          <div><Badge bg="light" text="dark" style={{ fontSize: '0.65rem' }}>parent</Badge></div>
                        )}
                        {cfg.parent && (
                          <div><Badge bg="secondary" style={{ fontSize: '0.65rem' }}>child of {cfg.parent}</Badge></div>
                        )}
                        <div
                          className="d-flex align-items-center gap-1 mt-1"
                          style={{ cursor: 'pointer', fontSize: '0.7rem', color: 'var(--theme-primary, #0891B2)' }}
                          onClick={() => toggleRules(settingsKey, key)}
                        >
                          {isExpanded ? <FaChevronDown style={{ fontSize: '0.55rem' }} /> : <FaChevronRight style={{ fontSize: '0.55rem' }} />}
                          <span>Rules ({fieldRules.length})</span>
                        </div>
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
                    {/* Rules row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0, background: '#f8fafc', borderTop: 'none' }}>
                          <div style={{ padding: '8px 12px' }}>
                            {fieldRules.length > 0 && (
                              <table style={{ width: '100%', fontSize: '0.78rem', marginBottom: '6px' }}>
                                <thead>
                                  <tr style={{ color: '#888' }}>
                                    <th style={{ padding: '2px 4px', fontWeight: 500 }}>Operator</th>
                                    <th style={{ padding: '2px 4px', fontWeight: 500 }}>Value</th>
                                    <th style={{ padding: '2px 4px', fontWeight: 500 }}>Label</th>
                                    <th style={{ padding: '2px 4px', fontWeight: 500 }}>Style</th>
                                    <th style={{ padding: '2px 4px', width: '60px' }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {fieldRules.map((rule, i) => {
                                    const isEditing = editingRule?.id === rulesId && editingRule?.index === i
                                    const er = isEditing ? editingRule : null
                                    return isEditing ? (
                                      <tr key={i} style={{ background: '#eef6ff' }}>
                                        <td style={{ padding: '2px 4px' }}>
                                          <Form.Select size="sm" style={{ fontSize: '0.72rem', width: '80px' }}
                                            value={er.operator} onChange={(e) => setEditingRule({ ...er, operator: e.target.value })}>
                                            {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                          </Form.Select>
                                        </td>
                                        <td style={{ padding: '2px 4px' }}>
                                          {er.operator === 'between' ? (
                                            <span className="d-flex align-items-center gap-1">
                                              <Form.Control size="sm" type="number" style={{ width: '60px', fontSize: '0.72rem' }}
                                                value={er.min ?? ''} onChange={(e) => setEditingRule({ ...er, min: e.target.value })} />
                                              <span style={{ fontSize: '0.72rem' }}>–</span>
                                              <Form.Control size="sm" type="number" style={{ width: '60px', fontSize: '0.72rem' }}
                                                value={er.max ?? ''} onChange={(e) => setEditingRule({ ...er, max: e.target.value })} />
                                            </span>
                                          ) : (
                                            <Form.Control size="sm" type="number" style={{ width: '70px', fontSize: '0.72rem' }}
                                              value={er.value ?? ''} onChange={(e) => setEditingRule({ ...er, value: e.target.value })} />
                                          )}
                                        </td>
                                        <td style={{ padding: '2px 4px' }}>
                                          <Form.Control size="sm" type="text" style={{ width: '80px', fontSize: '0.72rem' }}
                                            value={er.label || ''} onChange={(e) => setEditingRule({ ...er, label: e.target.value })} />
                                        </td>
                                        <td style={{ padding: '2px 4px' }}>
                                          <Form.Select size="sm" style={{ width: '100px', fontSize: '0.72rem' }}
                                            value={er.display || ''} onChange={(e) => setEditingRule({ ...er, display: e.target.value })}>
                                            {DISPLAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                          </Form.Select>
                                        </td>
                                        <td style={{ padding: '2px 4px' }}>
                                          <span className="d-flex gap-1">
                                            <button className="btn btn-link p-0 text-success" style={{ fontSize: '0.7rem' }}
                                              onClick={() => handleEditRule(settingsKey, key, fieldRules, i)}
                                              disabled={!isRuleValid(er)}>
                                              <FaSave />
                                            </button>
                                            <button className="btn btn-link p-0 text-secondary" style={{ fontSize: '0.7rem' }}
                                              onClick={() => setEditingRule(null)}>
                                              <FaTimes />
                                            </button>
                                          </span>
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr key={i}>
                                        <td style={{ padding: '2px 4px' }}>{rule.operator}</td>
                                        <td style={{ padding: '2px 4px' }}>
                                          {rule.operator === 'between' ? `${rule.min} – ${rule.max}` : rule.value}
                                        </td>
                                        <td style={{ padding: '2px 4px' }}>
                                          <span style={{
                                            fontWeight: rule.display?.includes('B') ? 700 : 400,
                                            fontStyle: rule.display?.includes('I') ? 'italic' : 'normal',
                                            textDecoration: rule.display?.includes('U') ? 'underline' : 'none',
                                          }}>
                                            {rule.label}
                                          </span>
                                        </td>
                                        <td style={{ padding: '2px 4px' }}>
                                          <Badge bg="light" text="dark" style={{ fontSize: '0.7rem' }}>
                                            {DISPLAY_OPTIONS.find(d => d.value === rule.display)?.label || rule.display}
                                          </Badge>
                                        </td>
                                        <td style={{ padding: '2px 4px' }}>
                                          <span className="d-flex gap-1">
                                            <button className="btn btn-link p-0 text-primary" style={{ fontSize: '0.7rem' }}
                                              onClick={() => setEditingRule({
                                                id: rulesId, index: i,
                                                operator: rule.operator, label: rule.label, display: rule.display,
                                                value: rule.value, min: rule.min, max: rule.max,
                                              })}>
                                              <FaEdit />
                                            </button>
                                            <button className="btn btn-link p-0 text-danger" style={{ fontSize: '0.7rem' }}
                                              onClick={() => handleDeleteRule(settingsKey, key, fieldRules, i)}>
                                              <FaTrash />
                                            </button>
                                          </span>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            )}
                            {/* Add new rule form */}
                            <div className="d-flex align-items-end gap-1 flex-wrap">
                              <Form.Select
                                size="sm"
                                style={{ width: '90px', fontSize: '0.75rem' }}
                                value={nr.operator || ''}
                                onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, operator: e.target.value } }))}
                              >
                                <option value="">Op</option>
                                {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </Form.Select>
                              {nr.operator === 'between' ? (
                                <>
                                  <Form.Control size="sm" type="number" placeholder="Min" style={{ width: '70px', fontSize: '0.75rem' }}
                                    value={nr.min ?? ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, min: e.target.value } }))} />
                                  <span style={{ fontSize: '0.75rem', color: '#888' }}>–</span>
                                  <Form.Control size="sm" type="number" placeholder="Max" style={{ width: '70px', fontSize: '0.75rem' }}
                                    value={nr.max ?? ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, max: e.target.value } }))} />
                                </>
                              ) : (
                                <Form.Control size="sm" type="number" placeholder="Value" style={{ width: '80px', fontSize: '0.75rem' }}
                                  value={nr.value ?? ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, value: e.target.value } }))} />
                              )}
                              <Form.Control size="sm" type="text" placeholder="Label (HIGH)" style={{ width: '100px', fontSize: '0.75rem' }}
                                value={nr.label || ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, label: e.target.value } }))} />
                              <Form.Select size="sm" style={{ width: '110px', fontSize: '0.75rem' }}
                                value={nr.display || ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, display: e.target.value } }))}>
                                <option value="">Style</option>
                                {DISPLAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                              </Form.Select>
                              <Button size="sm" className="btn-theme-add" style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                onClick={() => handleAddRule(settingsKey, key, fieldRules)}
                                disabled={!isRuleValid(nr)}>
                                <FaPlus />
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                    )
                  })}

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
            <hr />
            <Row className="align-items-end">
              <Col xs={6} md={3}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.8rem' }} className="fw-semibold">Default Prescription Valid Days</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    defaultValue={settings?.checkupPdf?.defaultValidDays || 30}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val) && val > 0 && val !== (settings?.checkupPdf?.defaultValidDays || 30)) {
                        handleUpdate({ checkupPdf: { defaultValidDays: val } })
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col xs={6} md={9}>
                <Form.Text className="text-muted">
                  Default number of days a prescription is valid. Can be overridden per checkup.
                </Form.Text>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>

      {/* Footer Contact Details */}
      <Col xs={12}>
        <Card className="shadow-sm">
          <Card.Header className="card-header-theme">
            <h5 className="mb-0 fs-responsive-md"><FaAddressCard className="me-2" />PDF Footer Contact Details</h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {['mobile', 'email', 'instagram', 'facebook'].map((key) => {
                const item = footerSettings[key] || {}
                return (
                  <Col xs={12} md={6} key={key}>
                    <Card className="border" style={{ opacity: item.visible === false ? 0.5 : 1 }}>
                      <Card.Body className="p-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="text-theme" style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{key}</strong>
                          <Form.Check
                            type="switch"
                            checked={item.visible !== false}
                            onChange={(e) => handleUpdate({ checkupPdf: { footer: { [key]: { visible: e.target.checked } } } })}
                            className="d-inline-block"
                          />
                        </div>
                        <Row className="g-2">
                          <Col xs={4}>
                            <Form.Control
                              size="sm"
                              type="text"
                              defaultValue={item.label || key}
                              placeholder="Label"
                              onBlur={(e) => {
                                const val = e.target.value.trim()
                                if (val && val !== (item.label || key)) handleUpdate({ checkupPdf: { footer: { [key]: { label: val } } } })
                              }}
                            />
                          </Col>
                          <Col xs={8}>
                            <Form.Control
                              size="sm"
                              type="text"
                              defaultValue={item.value || ''}
                              placeholder="Value"
                              onBlur={(e) => {
                                const val = e.target.value.trim()
                                if (val !== (item.value || '')) handleUpdate({ checkupPdf: { footer: { [key]: { value: val } } } })
                              }}
                            />
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                )
              })}
              <Col xs={12}>
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: '0.85rem' }} className="fw-semibold">Invoice Thank You Text</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    defaultValue={footerSettings.thankYouInvoice || ''}
                    onBlur={(e) => {
                      const val = e.target.value.trim()
                      if (val !== (footerSettings.thankYouInvoice || '')) handleUpdate({ checkupPdf: { footer: { thankYouInvoice: val } } })
                    }}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.85rem' }} className="fw-semibold">Prescription Thank You Text</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    defaultValue={footerSettings.thankYouPrescription || ''}
                    onBlur={(e) => {
                      const val = e.target.value.trim()
                      if (val !== (footerSettings.thankYouPrescription || '')) handleUpdate({ checkupPdf: { footer: { thankYouPrescription: val } } })
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>

      {/* E-Signature */}
      <Col xs={12}>
        <Card className="shadow-sm">
          <Card.Header className="card-header-theme">
            <h5 className="mb-0 fs-responsive-md"><FaSignature className="me-2" />E-Signature</h5>
          </Card.Header>
          <Card.Body>
            {savedESign && (
              <div className="mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Current Signature</Form.Label>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', background: '#fff', textAlign: 'center' }}>
                  <img src={savedESign} alt="Saved Signature" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                </div>
              </div>
            )}
            <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>{savedESign ? 'Draw New Signature' : 'Draw Signature'}</Form.Label>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '6px', background: '#f8fafc', marginBottom: '0.75rem', touchAction: 'none' }}>
              <canvas
                ref={sigCanvasRef}
                width={400}
                height={150}
                style={{ width: '100%', height: '150px', cursor: 'crosshair', display: 'block' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                className="btn-theme"
                onClick={saveSignature}
                disabled={!hasStrokes}
              >
                <FaSave className="me-1" /> Save Signature
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={clearCanvas}
              >
                <FaTimes className="me-1" /> Clear
              </Button>
              {savedESign && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => {
                    if (window.confirm('Remove saved signature?')) {
                      handleUpdate({ checkupPdf: { eSign: '' } })
                    }
                  }}
                >
                  <FaTrash className="me-1" /> Remove
                </Button>
              )}
            </div>
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
