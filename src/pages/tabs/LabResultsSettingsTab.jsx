import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Row, Col, Card, Form, Badge } from 'react-bootstrap'
import { FaPlus, FaTrash, FaFilePdf, FaStethoscope, FaVial, FaChevronDown, FaChevronRight, FaEdit, FaSave, FaTimes, FaAddressCard, FaSignature } from 'react-icons/fa'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function CheckupSettingsTab() {
  const dispatch = useDispatch()
  const { settings, loading } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { error: showError, confirm } = useNotification()

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
    const rule = { operator: r.operator, label: r.label.trim(), notation: (r.notation || '{label}').trim() }
    if (r.operator === 'between') {
      rule.min = parseFloat(r.min)
      rule.max = parseFloat(r.max)
    } else {
      rule.value = parseFloat(r.value)
    }
    return rule
  }

  const isRuleValid = (r) => {
    if (!r || !r.operator || !r.label?.trim()) return false
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

  // Read from Firestore settings
  const DISPLAY_OPTIONS = (settings?.dropdowns?.displayFormats || []).map(o => ({ value: o.key, label: o.label }))
  const OPERATORS = (settings?.dropdowns?.operators || []).map(o => ({ value: o.key, label: o.label }))

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
    if (!(await confirm(`Delete field "${fieldKey}"?`))) return
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
    <Row className="align-items-end mb-2 g-1">
      <Col xs={12}>
        <small className="fw-semibold text-theme" style={{ fontSize: '0.72rem' }}>{label}</small>
      </Col>
      <Col xs={6} md={3}>
        <Form.Group>
          <Form.Label style={{ fontSize: '0.68rem', color: '#64748b' }}>Page Format</Form.Label>
          <Form.Select size="sm" value={pdf.format} onChange={(e) => handlePdfChange(type, 'format', e.target.value)} style={{ fontSize: '0.78rem' }}>
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
          <Form.Label style={{ fontSize: '0.68rem', color: '#64748b' }}>Width (mm)</Form.Label>
          <Form.Control size="sm" type="number" value={pdf.width} onChange={(e) => handlePdfChange(type, 'width', e.target.value)} disabled={pdf.format !== 'custom'} style={{ fontSize: '0.78rem' }} />
        </Form.Group>
      </Col>
      <Col xs={3} md={2}>
        <Form.Group>
          <Form.Label style={{ fontSize: '0.68rem', color: '#64748b' }}>Height (mm)</Form.Label>
          <Form.Control size="sm" type="number" value={pdf.height} onChange={(e) => handlePdfChange(type, 'height', e.target.value)} disabled={pdf.format !== 'custom'} style={{ fontSize: '0.78rem' }} />
        </Form.Group>
      </Col>
      <Col xs={6} md={2}>
        <Form.Group>
          <Form.Label style={{ fontSize: '0.68rem', color: '#64748b' }}>Orientation</Form.Label>
          <Form.Select size="sm" value={pdf.orientation} onChange={(e) => handlePdfChange(type, 'orientation', e.target.value)} style={{ fontSize: '0.78rem' }}>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col xs={6} md={3}>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', paddingBottom: '0.4rem' }}>
          {pdf.width} x {pdf.height} mm ({pdf.orientation})
        </div>
      </Col>
    </Row>
  )

  // Reusable fields table
  const renderFieldsTable = (settingsKey, title, icon, fields, sortedFields, parentOptions, showEmpty, newKey, newLabel, newParent, setNewKey, setNewLabel, setNewParent) => (
    <>
      {/* Display setting */}
      <Col xs={12}>
        <Card className="shadow-sm border-0">
          <Card.Body className="py-2 px-3">
            <small className="fw-bold text-muted d-block mb-2">{icon} {title.toUpperCase()}</small>
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Default empty field behaviour</Form.Label>
              <Form.Select size="sm"
                value={showEmpty}
                onChange={(e) => handleShowEmptyToggle(settingsKey, e.target.value)}
                style={{ maxWidth: '350px', fontSize: '0.8rem' }}
              >
                <option value="hide">Hide empty fields</option>
                <option value="show">Show empty fields (blank)</option>
                <option value="na">Show empty fields with N/A</option>
              </Form.Select>
              <Form.Text className="text-muted" style={{ fontSize: '0.6rem' }}>
                Each field can override this with its own Display setting below.
              </Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Default Notation Template</Form.Label>
              <Form.Control size="sm"
                type="text"
                defaultValue={settings?.[settingsKey]?.defaultNotation || '{value}({label})'}
                placeholder="{value}({label})"
                onBlur={(e) => {
                  const val = e.target.value.trim()
                  if (val !== (settings?.[settingsKey]?.defaultNotation || '{value}({label})')) {
                    handleUpdate({ [settingsKey]: { defaultNotation: val } })
                  }
                }}
                style={{ maxWidth: '350px', fontSize: '0.8rem' }}
              />
              <Form.Text className="text-muted" style={{ fontSize: '0.6rem' }}>
                Keywords: <code>{'{value}'}</code> = result, <code>{'{label}'}</code> = rule label, <code>{'{style}'}</code> = apply rule style.
                Example: <code>{'{value}'} ({'{label}'})</code> → <em>140 (HIGH)</em>
              </Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>
      </Col>

      {/* Fields table */}
      <Col xs={12}>
        <Card className="shadow-sm border-0">
          <Card.Body className="py-2 px-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="fw-bold text-muted">{title.toUpperCase()} FIELDS</small>
              <Badge bg="info" style={{ fontSize: '0.6rem' }}>{sortedFields.length} fields</Badge>
            </div>
            <div>
              {/* Column headers (desktop) */}
              <div className="d-none d-md-flex align-items-center gap-1 py-1 px-1 mb-1" style={{ fontSize: '0.58rem', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ width: 28 }}>Vis</span>
                <span style={{ flex: 1 }}>Key</span>
                <span style={{ flex: 1.5 }}>Label</span>
                <span style={{ width: 50 }}>Order</span>
                <span style={{ flex: 1 }}>Group</span>
                <span style={{ flex: 1 }}>Display</span>
                <span style={{ width: 24 }}></span>
              </div>

              {sortedFields.map(([key, cfg]) => {
                const rulesId = `${settingsKey}.${key}`
                const isExpanded = expandedRules[rulesId]
                const fieldRules = cfg.rules || []
                const nr = newRule[rulesId] || {}
                return (
                <React.Fragment key={key}>
                  <div className="d-flex flex-wrap align-items-center gap-1 py-1 px-1" style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem', opacity: cfg.visible === false ? 0.5 : 1 }}>
                    {/* Visible */}
                    <span style={{ width: 28 }}>
                      <Form.Check type="checkbox" checked={cfg.visible !== false}
                        onChange={(e) => handleToggleVisible(settingsKey, key, e.target.checked)} />
                    </span>
                    {/* Key */}
                    <span style={{ flex: 1 }}>
                      <strong style={{ color: '#0891B2', fontSize: '0.72rem' }}>{key}</strong>
                      {cfg.children && <Badge bg="light" text="dark" className="ms-1" style={{ fontSize: '0.5rem' }}>parent</Badge>}
                      {cfg.parent && <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.5rem' }}>child of {cfg.parent}</Badge>}
                      <div className="d-flex align-items-center gap-1 mt-1"
                        style={{ cursor: 'pointer', fontSize: '0.62rem', color: '#0891B2' }}
                        onClick={() => toggleRules(settingsKey, key)}>
                        {isExpanded ? <FaChevronDown style={{ fontSize: '0.45rem' }} /> : <FaChevronRight style={{ fontSize: '0.45rem' }} />}
                        <span>Rules ({fieldRules.length})</span>
                      </div>
                    </span>
                    {/* Label */}
                    <span style={{ flex: 1.5 }}>
                      <Form.Control size="sm" type="text" defaultValue={cfg.label || key}
                        onBlur={(e) => { const val = e.target.value.trim(); if (val && val !== (cfg.label || key)) handleLabelChange(settingsKey, key, val) }}
                        style={{ fontSize: '0.72rem', height: 24 }} />
                    </span>
                    {/* Order */}
                    <span style={{ width: 50 }} className="d-none d-md-block">
                      <Form.Control size="sm" type="number" defaultValue={cfg.order || 0}
                        onBlur={(e) => handleOrderChange(settingsKey, key, e.target.value)}
                        style={{ fontSize: '0.72rem', height: 24, textAlign: 'center' }} />
                    </span>
                    {/* Group Under */}
                    <span style={{ flex: 1 }} className="d-none d-md-block">
                      <Form.Select size="sm" value={cfg.parent || ''}
                        onChange={(e) => handleParentChange(settingsKey, fields, key, e.target.value)}
                        disabled={!!cfg.children} style={{ fontSize: '0.65rem', height: 24, padding: '0 4px' }}>
                        <option value="">— None —</option>
                        {parentOptions.filter(([k]) => k !== key).map(([k, c]) => (
                          <option key={k} value={k}>{c.label || k}</option>
                        ))}
                      </Form.Select>
                    </span>
                    {/* Display */}
                    <span style={{ flex: 1 }} className="d-none d-md-block">
                      <Form.Select size="sm" value={cfg.display || 'default'}
                        onChange={(e) => handleDisplayChange(settingsKey, key, e.target.value)}
                        style={{ fontSize: '0.65rem', height: 24, padding: '0 4px' }}>
                        <option value="default">Default</option>
                        <option value="always">Always (N/A)</option>
                        <option value="valueOnly">Only with value</option>
                      </Form.Select>
                    </span>
                    {/* Delete */}
                    <span style={{ width: 24 }}>
                      <button type="button" onClick={() => handleDeleteField(settingsKey, fields, key)}
                        style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }} aria-label="Delete field">
                        <FaTrash size={9} />
                      </button>
                    </span>
                  </div>

                  {/* Rules expandable */}
                  {isExpanded && (
                    <div style={{ padding: '6px 8px 6px 36px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '4px', background: '#f1f5f9', padding: '3px 6px', borderRadius: 3 }}>
                        <code>{'{value}'}</code> = result, <code>{'{label}'}</code> = rule label. Example: <code>{'{value}'} ({'{label}'})</code> → <em>140 (HIGH)</em>
                      </div>
                      {fieldRules.length > 0 && (
                        <div style={{ marginBottom: '4px' }}>
                          {/* Rules header */}
                          <div className="d-flex gap-1 mb-1" style={{ fontSize: '0.55rem', color: '#94a3b8' }}>
                            <span style={{ width: 70 }}>Operator</span>
                            <span style={{ width: 70 }}>Value</span>
                            <span style={{ width: 80 }}>Label</span>
                            <span style={{ flex: 1 }}>Notation</span>
                            <span style={{ width: 36 }}></span>
                          </div>
                          {fieldRules.map((rule, i) => {
                            const isEditing = editingRule?.id === rulesId && editingRule?.index === i
                            const er = isEditing ? editingRule : null
                            return isEditing ? (
                              <div key={i} className="d-flex align-items-center gap-1 py-1 flex-wrap" style={{ background: '#eef6ff', borderRadius: 3, padding: '2px 4px', fontSize: '0.72rem' }}>
                                <Form.Select size="sm" style={{ fontSize: '0.65rem', width: 70, height: 22, padding: '0 2px' }}
                                  value={er.operator} onChange={(e) => setEditingRule({ ...er, operator: e.target.value })}>
                                  {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </Form.Select>
                                {er.operator === 'between' ? (
                                  <span className="d-flex align-items-center gap-1" style={{ width: 70 }}>
                                    <Form.Control size="sm" type="number" style={{ width: 30, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                                      value={er.min ?? ''} onChange={(e) => setEditingRule({ ...er, min: e.target.value })} />
                                    <span style={{ fontSize: '0.6rem' }}>–</span>
                                    <Form.Control size="sm" type="number" style={{ width: 30, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                                      value={er.max ?? ''} onChange={(e) => setEditingRule({ ...er, max: e.target.value })} />
                                  </span>
                                ) : (
                                  <Form.Control size="sm" type="number" style={{ width: 70, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                                    value={er.value ?? ''} onChange={(e) => setEditingRule({ ...er, value: e.target.value })} />
                                )}
                                <Form.Control size="sm" type="text" style={{ width: 80, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                                  value={er.label || ''} onChange={(e) => setEditingRule({ ...er, label: e.target.value })} />
                                <Form.Control size="sm" type="text" style={{ flex: 1, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                                  value={er.notation ?? '{label}'} onChange={(e) => setEditingRule({ ...er, notation: e.target.value })} placeholder="{label}" />
                                <span className="d-flex gap-1" style={{ width: 36 }}>
                                  <button type="button" onClick={() => handleEditRule(settingsKey, key, fieldRules, i)} disabled={!isRuleValid(er)}
                                    style={{ border: 'none', background: 'none', color: '#16a34a', cursor: 'pointer', padding: 0 }}><FaSave size={9} /></button>
                                  <button type="button" onClick={() => setEditingRule(null)}
                                    style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}><FaTimes size={9} /></button>
                                </span>
                              </div>
                            ) : (
                              <div key={i} className="d-flex align-items-center gap-1 py-1" style={{ fontSize: '0.68rem' }}>
                                <span style={{ width: 70 }}>{rule.operator}</span>
                                <span style={{ width: 70 }}>{rule.operator === 'between' ? `${rule.min} – ${rule.max}` : rule.value}</span>
                                <span style={{ width: 80 }}>{rule.label}</span>
                                <span style={{ flex: 1 }}>
                                  <code style={{ fontSize: '0.6rem', background: '#f1f5f9', padding: '1px 3px', borderRadius: 2 }}>
                                    {rule.notation || rule.display || '{label}'}
                                  </code>
                                </span>
                                <span className="d-flex gap-1" style={{ width: 36 }}>
                                  <button type="button" onClick={() => setEditingRule({
                                    id: rulesId, index: i, operator: rule.operator, label: rule.label,
                                    notation: rule.notation || rule.display || '{label}', value: rule.value, min: rule.min, max: rule.max,
                                  })} style={{ border: 'none', background: 'none', color: '#0891B2', cursor: 'pointer', padding: 0 }}><FaEdit size={9} /></button>
                                  <button type="button" onClick={() => handleDeleteRule(settingsKey, key, fieldRules, i)}
                                    style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}><FaTrash size={9} /></button>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {/* Add new rule */}
                      <div className="d-flex align-items-center gap-1 flex-wrap">
                        <Form.Select size="sm" style={{ width: 70, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                          value={nr.operator || ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, operator: e.target.value } }))}>
                          <option value="">Op</option>
                          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </Form.Select>
                        {nr.operator === 'between' ? (
                          <>
                            <Form.Control size="sm" type="number" placeholder="Min" style={{ width: 50, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                              value={nr.min ?? ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, min: e.target.value } }))} />
                            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>–</span>
                            <Form.Control size="sm" type="number" placeholder="Max" style={{ width: 50, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                              value={nr.max ?? ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, max: e.target.value } }))} />
                          </>
                        ) : (
                          <Form.Control size="sm" type="number" placeholder="Value" style={{ width: 60, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                            value={nr.value ?? ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, value: e.target.value } }))} />
                        )}
                        <Form.Control size="sm" type="text" placeholder="Label" style={{ width: 70, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                          value={nr.label || ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, label: e.target.value } }))} />
                        <Form.Control size="sm" type="text" placeholder="{label}" style={{ width: 80, fontSize: '0.65rem', height: 22, padding: '0 2px' }}
                          value={nr.notation || ''} onChange={(e) => setNewRule(prev => ({ ...prev, [rulesId]: { ...nr, notation: e.target.value } }))} />
                        <button type="button" onClick={() => handleAddRule(settingsKey, key, fieldRules)} disabled={!isRuleValid(nr)}
                          style={{ fontSize: '0.6rem', padding: '1px 6px', backgroundColor: '#0891B2', color: '#fff', border: 'none', borderRadius: 3, opacity: !isRuleValid(nr) ? 0.5 : 1 }}>
                          <FaPlus size={8} />
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
                )
              })}

              {/* Add new field row */}
              <div className="d-flex flex-wrap align-items-center gap-1 py-1 px-1" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                <span style={{ width: 28 }}></span>
                <span style={{ flex: 1 }}>
                  <Form.Control size="sm" type="text" placeholder="key" value={newKey} onChange={(e) => setNewKey(e.target.value)}
                    style={{ fontSize: '0.72rem', height: 24 }} />
                </span>
                <span style={{ flex: 1.5 }}>
                  <Form.Control size="sm" type="text" placeholder="Display Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                    style={{ fontSize: '0.72rem', height: 24 }} />
                </span>
                <span style={{ width: 50 }} className="d-none d-md-block"></span>
                <span style={{ flex: 1 }} className="d-none d-md-block">
                  <Form.Select size="sm" value={newParent} onChange={(e) => setNewParent(e.target.value)}
                    style={{ fontSize: '0.65rem', height: 24, padding: '0 4px' }}>
                    <option value="">— None —</option>
                    {parentOptions.map(([k, c]) => (
                      <option key={k} value={k}>{c.label || k}</option>
                    ))}
                  </Form.Select>
                </span>
                <span style={{ flex: 1 }} className="d-none d-md-block"></span>
                <span style={{ width: 24 }}>
                  <button type="button"
                    onClick={() => handleAddField(settingsKey, fields, sortedFields, newKey, newLabel, newParent, () => { setNewKey(''); setNewLabel(''); setNewParent('') })}
                    disabled={!newKey.trim() || !newLabel.trim()}
                    style={{ border: 'none', background: 'none', color: '#0891B2', cursor: 'pointer', padding: 0, opacity: (!newKey.trim() || !newLabel.trim()) ? 0.4 : 1 }}
                    aria-label="Add field">
                    <FaPlus size={10} />
                  </button>
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </>
  )

  return (
    <Row className="g-2">
      {/* PDF Settings */}
      <Col xs={12}>
        <Card className="shadow-sm border-0">
          <Card.Body className="py-2 px-3">
            <small className="fw-bold text-muted d-block mb-2"><FaFilePdf className="me-2" style={{ fontSize: '0.7rem' }} />PDF SETTINGS</small>
            {renderPdfRow('invoice', 'Invoice', invoicePdf)}
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />
            {renderPdfRow('prescription', 'Prescription', prescriptionPdf)}
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />
            <Row className="align-items-end g-1">
              <Col xs={6} md={3}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.68rem', color: '#64748b' }}>Default Prescription Valid Days</Form.Label>
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
                    style={{ fontSize: '0.78rem' }}
                  />
                </Form.Group>
              </Col>
              <Col xs={6} md={9}>
                <Form.Text className="text-muted" style={{ fontSize: '0.6rem' }}>
                  Default days a prescription is valid. Can be overridden per checkup.
                </Form.Text>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>

      {/* Appointment Notifications */}
      <Col xs={12}>
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body className="py-2 px-3">
            <small className="fw-bold text-muted d-block mb-2">APPOINTMENT NOTIFICATIONS</small>
            <Row className="g-2">
              <Col xs={12} md={6}>
                <div className="p-2 rounded" style={{ border: '1px solid #e2e8f0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="fw-semibold" style={{ fontSize: '0.72rem', color: '#16a34a' }}>WhatsApp</small>
                    <Form.Check type="switch" checked={settings?.checkupPdf?.appointmentNotify?.whatsapp?.enabled || false}
                      onChange={(e) => handleUpdate({ checkupPdf: { appointmentNotify: { whatsapp: { enabled: e.target.checked } } } })} />
                  </div>
                  <Form.Control size="sm" type="tel" defaultValue={settings?.checkupPdf?.appointmentNotify?.whatsapp?.number || ''}
                    onBlur={(e) => handleUpdate({ checkupPdf: { appointmentNotify: { whatsapp: { number: e.target.value.trim() } } } })}
                    placeholder="WhatsApp number (e.g., 94771234567)" style={{ fontSize: '0.75rem' }} />
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="p-2 rounded" style={{ border: '1px solid #e2e8f0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="fw-semibold" style={{ fontSize: '0.72rem', color: '#0891B2' }}>Email</small>
                    <Form.Check type="switch" checked={settings?.checkupPdf?.appointmentNotify?.email?.enabled || false}
                      onChange={(e) => handleUpdate({ checkupPdf: { appointmentNotify: { email: { enabled: e.target.checked } } } })} />
                  </div>
                  <Form.Control size="sm" type="email" defaultValue={settings?.checkupPdf?.appointmentNotify?.email?.address || ''}
                    onBlur={(e) => handleUpdate({ checkupPdf: { appointmentNotify: { email: { address: e.target.value.trim() } } } })}
                    placeholder="Notification email address" style={{ fontSize: '0.75rem' }} />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>

      {/* PDF Header Branding */}
      <Col xs={12}>
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body className="py-2 px-3">
            <small className="fw-bold text-muted d-block mb-2">PDF HEADER BRANDING</small>
            <Row className="g-2">
              <Col xs={12} md={6}>
                <Form.Group className="mb-1">
                  <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Invoice Title</Form.Label>
                  <Form.Control size="sm" type="text" defaultValue={settings?.checkupPdf?.header?.invoiceTitle || ''}
                    onBlur={(e) => { const val = e.target.value.trim(); handleUpdate({ checkupPdf: { header: { invoiceTitle: val } } }) }}
                    placeholder="e.g., AH WELLNESS HUB & ASIRI LABORATORIES" style={{ fontSize: '0.78rem' }} />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-1">
                  <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Prescription Title</Form.Label>
                  <Form.Control size="sm" type="text" defaultValue={settings?.checkupPdf?.header?.prescriptionTitle || ''}
                    onBlur={(e) => { const val = e.target.value.trim(); handleUpdate({ checkupPdf: { header: { prescriptionTitle: val } } }) }}
                    placeholder="e.g., AH WELLNESS HUB" style={{ fontSize: '0.78rem' }} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Subtitle</Form.Label>
                  <Form.Control size="sm" type="text" defaultValue={settings?.checkupPdf?.header?.subtitle || ''}
                    onBlur={(e) => { const val = e.target.value.trim(); handleUpdate({ checkupPdf: { header: { subtitle: val } } }) }}
                    placeholder="e.g., Complete Health Care Solutions" style={{ fontSize: '0.78rem' }} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>

      {/* Footer Contact Details */}
      <Col xs={12}>
        <Card className="shadow-sm border-0">
          <Card.Body className="py-2 px-3">
            <small className="fw-bold text-muted d-block mb-2"><FaAddressCard className="me-2" style={{ fontSize: '0.7rem' }} />PDF FOOTER CONTACT DETAILS</small>
            <Row className="g-2">
              {['mobile', 'email', 'instagram', 'facebook'].map((key) => {
                const item = footerSettings[key] || {}
                return (
                  <Col xs={12} md={6} key={key}>
                    <div className="p-2 rounded" style={{ border: '1px solid #e2e8f0', opacity: item.visible === false ? 0.5 : 1 }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="fw-semibold text-theme" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{key}</small>
                        <Form.Check type="switch" checked={item.visible !== false}
                          onChange={(e) => handleUpdate({ checkupPdf: { footer: { [key]: { visible: e.target.checked } } } })} />
                      </div>
                      <Row className="g-1">
                        <Col xs={4}>
                          <Form.Control size="sm" type="text" defaultValue={item.label || key} placeholder="Label"
                            onBlur={(e) => { const val = e.target.value.trim(); if (val && val !== (item.label || key)) handleUpdate({ checkupPdf: { footer: { [key]: { label: val } } } }) }}
                            style={{ fontSize: '0.75rem' }} />
                        </Col>
                        <Col xs={8}>
                          <Form.Control size="sm" type="text" defaultValue={item.value || ''} placeholder="Value"
                            onBlur={(e) => { const val = e.target.value.trim(); if (val !== (item.value || '')) handleUpdate({ checkupPdf: { footer: { [key]: { value: val } } } }) }}
                            style={{ fontSize: '0.75rem' }} />
                        </Col>
                      </Row>
                    </div>
                  </Col>
                )
              })}
              <Col xs={12}>
                <Form.Group className="mb-1">
                  <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Invoice Thank You Text</Form.Label>
                  <Form.Control size="sm" type="text" defaultValue={footerSettings.thankYouInvoice || ''}
                    onBlur={(e) => { const val = e.target.value.trim(); if (val !== (footerSettings.thankYouInvoice || '')) handleUpdate({ checkupPdf: { footer: { thankYouInvoice: val } } }) }}
                    style={{ fontSize: '0.78rem' }} />
                </Form.Group>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Prescription Thank You Text</Form.Label>
                  <Form.Control size="sm" type="text" defaultValue={footerSettings.thankYouPrescription || ''}
                    onBlur={(e) => { const val = e.target.value.trim(); if (val !== (footerSettings.thankYouPrescription || '')) handleUpdate({ checkupPdf: { footer: { thankYouPrescription: val } } }) }}
                    style={{ fontSize: '0.78rem' }} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>

      {/* E-Signature */}
      <Col xs={12}>
        <Card className="shadow-sm border-0">
          <Card.Body className="py-2 px-3">
            <small className="fw-bold text-muted d-block mb-2"><FaSignature className="me-2" style={{ fontSize: '0.7rem' }} />E-SIGNATURE</small>
            {savedESign && (
              <div className="mb-2">
                <Form.Label style={{ fontSize: '0.68rem', color: '#64748b' }}>Current Signature</Form.Label>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px', background: '#fff', textAlign: 'center' }}>
                  <img src={savedESign} alt="Saved Signature" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                </div>
              </div>
            )}
            <Form.Label style={{ fontSize: '0.68rem', color: '#64748b' }}>{savedESign ? 'Draw New Signature' : 'Draw Signature'}</Form.Label>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 4, background: '#f8fafc', marginBottom: '0.5rem', touchAction: 'none' }}>
              <canvas
                ref={sigCanvasRef}
                width={400}
                height={120}
                style={{ width: '100%', height: '120px', cursor: 'crosshair', display: 'block' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <div className="d-flex gap-1">
              <button type="button" onClick={saveSignature} disabled={!hasStrokes}
                style={{ fontSize: '0.65rem', padding: '2px 10px', backgroundColor: '#0891B2', color: '#fff', border: 'none', borderRadius: 3, opacity: !hasStrokes ? 0.5 : 1 }}>
                <FaSave size={9} className="me-1" /> Save
              </button>
              <button type="button" onClick={clearCanvas}
                style={{ fontSize: '0.65rem', padding: '2px 10px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 3 }}>
                <FaTimes size={9} className="me-1" /> Clear
              </button>
              {savedESign && (
                <button type="button" onClick={async () => {
                    const ok = await confirm('Remove saved signature?', { title: 'Remove Signature', variant: 'warning' })
                    if (ok) handleUpdate({ checkupPdf: { eSign: '' } })
                  }}
                  style={{ fontSize: '0.65rem', padding: '2px 10px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 3 }}>
                  <FaTrash size={9} className="me-1" /> Remove
                </button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* General Tests */}
      {renderFieldsTable(
        'generalTests', 'General Tests', <FaStethoscope className="me-1" style={{ fontSize: '0.7rem' }} />,
        genFields, sortedGenFields, genParentOptions, genShowEmpty,
        newGenFieldKey, newGenFieldLabel, newGenFieldParent,
        setNewGenFieldKey, setNewGenFieldLabel, setNewGenFieldParent
      )}

      {/* Lab Results */}
      {renderFieldsTable(
        'labResults', 'Lab Results', <FaVial className="me-1" style={{ fontSize: '0.7rem' }} />,
        labFields, sortedLabFields, labParentOptions, labShowEmpty,
        newLabFieldKey, newLabFieldLabel, newLabFieldParent,
        setNewLabFieldKey, setNewLabFieldLabel, setNewLabFieldParent
      )}
    </Row>
  )
}

export default CheckupSettingsTab
