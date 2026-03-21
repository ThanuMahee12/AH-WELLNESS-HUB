import { useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Accordion, Row, Col, Badge } from 'react-bootstrap'
import { FaShieldAlt, FaChevronDown, FaChevronRight, FaPlus, FaTrash, FaBell, FaGripVertical, FaStar } from 'react-icons/fa'
import { useSettings } from '../../hooks/useSettings'
import { updateSettings } from '../../store/settingsSlice'
import { useNotification } from '../../context'
import { ICON_MAP, ENTITY_LABELS } from '../../constants/defaultSettings'

const ROLES = ['superadmin', 'maintainer', 'editor', 'user']
const RS = { superadmin: 'S', maintainer: 'M', editor: 'E', user: 'U' }
const RC = { superadmin: '#ef4444', maintainer: '#f59e0b', editor: '#0891B2', user: '#64748b' }

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: 'Aa', hasOptions: false },
  { value: 'number', label: 'Number', icon: '#', hasOptions: false },
  { value: 'email', label: 'Email', icon: '@', hasOptions: false },
  { value: 'tel', label: 'Phone', icon: 'Ph', hasOptions: false },
  { value: 'password', label: 'Password', icon: '**', hasOptions: false },
  { value: 'date', label: 'Date', icon: 'D', hasOptions: false },
  { value: 'textarea', label: 'Textarea', icon: 'T', hasOptions: false },
  { value: 'select', label: 'Dropdown', icon: 'v', hasOptions: true },
  { value: 'radio', label: 'Radio', icon: 'o', hasOptions: true },
  { value: 'checkbox', label: 'Checkbox', icon: 'x', hasOptions: false },
  { value: 'list', label: 'Tags/List', icon: '[]', hasOptions: false },
  { value: 'richtext', label: 'Rich Text', icon: 'RT', hasOptions: false },
  { value: 'custom', label: 'Custom', icon: 'C', hasOptions: false },
]

const TYPE_HAS_OPTIONS = new Set(FIELD_TYPES.filter(t => t.hasOptions).map(t => t.value))

const S = {
  pill: { fontSize: '0.58rem', padding: '1px 6px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', lineHeight: '16px', display: 'inline-flex', alignItems: 'center', gap: 3 },
  label: { fontSize: '0.58rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 },
  input: { fontSize: '0.7rem', height: 24, borderRadius: 4 },
  section: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', marginTop: 4 },
}

const RoleBtn = ({ role, active, onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ fontSize: '0.5rem', padding: '0 3px', border: `1px solid ${active ? RC[role] : '#e2e8f0'}`,
      borderRadius: 2, backgroundColor: active ? RC[role] : 'transparent',
      color: active ? '#fff' : '#cbd5e1', fontWeight: 700, opacity: disabled ? 0.3 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
    {RS[role]}
  </button>
)

const PermNum = ({ role, value, onChange, disabled }) => {
  const color = value === 7 ? '#16a34a' : value >= 4 ? '#d97706' : value > 0 ? '#dc2626' : '#94a3b8'
  const cycle = () => { if (!disabled) onChange(value >= 7 ? 0 : value === 0 ? 4 : value === 4 ? 6 : 7) }
  return (
    <div className="d-flex align-items-center gap-1" title={`${role}: ${value} (click to cycle)`}>
      <span style={{ fontSize: '0.55rem', color: RC[role], fontWeight: 700, width: 10 }}>{RS[role]}</span>
      <button type="button" onClick={cycle} disabled={disabled}
        style={{ width: 26, height: 22, fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace',
          textAlign: 'center', padding: 0, border: `1.5px solid ${color}44`, borderRadius: 4, backgroundColor: `${color}11`, color,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, lineHeight: '20px' }}>
        {value}
      </button>
    </div>
  )
}

/* ===== Options Editor for select/radio ===== */
const OptionsEditor = ({ options = [], onChange }) => {
  const [newLabel, setNewLabel] = useState('')
  const [newKey, setNewKey] = useState('')

  const normalizeOpts = (opts) => opts.map(o => typeof o === 'string' ? { label: o, key: o.toLowerCase().replace(/\s+/g, '_'), is_default: false } : o)
  const opts = normalizeOpts(options)

  const addOption = () => {
    const label = newLabel.trim()
    if (!label) return
    const key = newKey.trim() || label.toLowerCase().replace(/\s+/g, '_')
    if (opts.find(o => o.key === key)) return
    onChange([...opts, { label, key, is_default: false }])
    setNewLabel('')
    setNewKey('')
  }

  const removeOption = (idx) => {
    const next = [...opts]
    next.splice(idx, 1)
    onChange(next)
  }

  const toggleDefault = (idx) => {
    const next = opts.map((o, i) => ({ ...o, is_default: i === idx ? !o.is_default : false }))
    onChange(next)
  }

  const updateOpt = (idx, field, value) => {
    const next = [...opts]
    next[idx] = { ...next[idx], [field]: value }
    onChange(next)
  }

  return (
    <div style={S.section}>
      <div className="d-flex align-items-center justify-content-between mb-1">
        <span style={S.label}>Options</span>
        <Badge bg="light" text="dark" style={{ fontSize: '0.55rem' }}>{opts.length} items</Badge>
      </div>

      {/* Options list */}
      {opts.length > 0 && (
        <div style={{ border: '1px solid #f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
          {/* Header */}
          <div className="d-flex align-items-center gap-2 px-2 py-1" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: '0.52rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            <span style={{ width: 14 }}></span>
            <span style={{ flex: 2 }}>Label</span>
            <span style={{ flex: 1 }}>Key</span>
            <span style={{ width: 30, textAlign: 'center' }}>Default</span>
            <span style={{ width: 20 }}></span>
          </div>
          {opts.map((opt, idx) => (
            <div key={idx} className="d-flex align-items-center gap-2 px-2 py-1" style={{ borderBottom: '1px solid #f8fafc', fontSize: '0.68rem', backgroundColor: opt.is_default ? '#f0fdf4' : '#fff' }}>
              <FaGripVertical size={7} style={{ color: '#cbd5e1', width: 14 }} />
              <Form.Control size="sm" value={opt.label} onChange={e => updateOpt(idx, 'label', e.target.value)}
                style={{ ...S.input, flex: 2, height: 22 }} />
              <Form.Control size="sm" value={opt.key} onChange={e => updateOpt(idx, 'key', e.target.value)}
                style={{ ...S.input, flex: 1, height: 22, color: '#64748b', fontFamily: 'monospace', fontSize: '0.6rem' }} />
              <span style={{ width: 30, textAlign: 'center' }}>
                <button type="button" className="btn p-0" onClick={() => toggleDefault(idx)}
                  style={{ color: opt.is_default ? '#f59e0b' : '#e2e8f0', lineHeight: 1 }} title="Set as default">
                  <FaStar size={10} />
                </button>
              </span>
              <span style={{ width: 20 }}>
                <button type="button" className="btn p-0" onClick={() => removeOption(idx)}
                  style={{ color: '#ef4444', lineHeight: 1, fontSize: '0.5rem' }}><FaTrash size={8} /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add new option */}
      <div className="d-flex align-items-center gap-1">
        <Form.Control size="sm" value={newLabel} onChange={e => { setNewLabel(e.target.value); if (!newKey) setNewKey('') }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
          placeholder="Label" style={{ ...S.input, flex: 2, height: 22 }} />
        <Form.Control size="sm" value={newKey} onChange={e => setNewKey(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
          placeholder="key (auto)" style={{ ...S.input, flex: 1, height: 22, fontFamily: 'monospace', fontSize: '0.6rem', color: '#64748b' }} />
        <button type="button" className="btn btn-sm d-flex align-items-center gap-1"
          onClick={addOption} disabled={!newLabel.trim()}
          style={{ fontSize: '0.58rem', padding: '2px 8px', backgroundColor: newLabel.trim() ? '#0891B2' : '#e2e8f0', color: '#fff', borderRadius: 4, height: 22, whiteSpace: 'nowrap' }}>
          <FaPlus size={7} /> Add
        </button>
      </div>
    </div>
  )
}

/* ===== Field Editor Panel ===== */
const FieldEditor = ({ field: f, entityKey, fieldKey, onUpdate }) => {
  const showOptions = TYPE_HAS_OPTIONS.has(f.type)

  return (
    <div className="ps-3 py-2 mb-1" style={{ backgroundColor: '#fafbfc', borderRadius: 6, borderLeft: '3px solid #0891B2', fontSize: '0.68rem' }}>
      {/* Row 1: Label, Type, Width */}
      <Row className="g-2 mb-2">
        <Col xs={5}>
          <label style={S.label}>Label</label>
          <Form.Control size="sm" value={f.label} onChange={e => onUpdate({ label: e.target.value })} style={S.input} />
        </Col>
        <Col xs={4}>
          <label style={S.label}>Type</label>
          <Form.Select size="sm" value={f.type} onChange={e => onUpdate({ type: e.target.value })} style={S.input}>
            {FIELD_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={3}>
          <label style={S.label}>Width</label>
          <Form.Select size="sm" value={f.colSize} onChange={e => onUpdate({ colSize: parseInt(e.target.value) })} style={S.input}>
            <option value={3}>25%</option>
            <option value={4}>33%</option>
            <option value={6}>50%</option>
            <option value={8}>66%</option>
            <option value={12}>100%</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Row 2: Placeholder + toggles */}
      <Row className="g-2 mb-1">
        <Col xs={5}>
          <label style={S.label}>Placeholder</label>
          <Form.Control size="sm" value={f.placeholder} onChange={e => onUpdate({ placeholder: e.target.value })} style={S.input} />
        </Col>
        <Col xs={7} className="d-flex align-items-end gap-3 pb-1 flex-wrap">
          <Form.Check type="switch" id={`${entityKey}-${fieldKey}-req`} checked={f.required}
            onChange={() => onUpdate({ required: !f.required })}
            label={<span style={{ fontSize: '0.62rem', fontWeight: 500 }}>Required</span>} />
          <Form.Check type="switch" id={`${entityKey}-${fieldKey}-tbl`} checked={f.inTable}
            onChange={() => onUpdate({ inTable: !f.inTable, tableVisible: true })}
            label={<span style={{ fontSize: '0.62rem', fontWeight: 500 }}>Table</span>} />
          <Form.Check type="switch" id={`${entityKey}-${fieldKey}-form`} checked={f.inForm}
            onChange={() => onUpdate({ inForm: !f.inForm })}
            label={<span style={{ fontSize: '0.62rem', fontWeight: 500 }}>Form</span>} />
        </Col>
      </Row>

      {/* Row 3: Options editor (select / radio only) */}
      {showOptions && (
        <OptionsEditor
          options={f.options}
          onChange={(newOpts) => onUpdate({ options: newOpts })}
        />
      )}
    </div>
  )
}

function PageControlTab() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const { error: showError } = useNotification()
  const [saving, setSaving] = useState(false)
  const [expandedField, setExpandedField] = useState(null)
  const [newFieldKey, setNewFieldKey] = useState('')
  const [addFieldType, setAddFieldType] = useState('text')

  const pages = settings?.pages || {}
  const permissions = settings?.permissions || {}
  const forms = settings?.forms || {}
  const tables = settings?.tables || {}
  const notifSettings = settings?.notifications || {}

  // Merge all resources
  const items = useMemo(() => {
    const allKeys = new Set([...Object.keys(pages).filter(k => k !== 'login' && k !== 'home'), ...Object.keys(permissions)])
    return [...allKeys].map(key => {
      // Merge form fields + table columns into unified fields
      const formFields = forms[key]?.fields || {}
      const tableColumns = tables[key]?.columns || {}
      const allFieldKeys = new Set([...Object.keys(formFields), ...Object.keys(tableColumns)])
      const fields = {}
      allFieldKeys.forEach(fk => {
        const ff = formFields[fk] || {}
        const tc = tableColumns[fk] || {}
        fields[fk] = {
          label: ff.label || tc.label || fk,
          type: ff.type || 'text',
          visible: ff.visible !== false,
          required: ff.required || false,
          colSize: ff.colSize || 6,
          placeholder: ff.placeholder || '',
          options: ff.options || [],
          roles: tc.roles || ff.roles || [...ROLES],
          perms: ff.perms || {},
          searchable: tc.searchable || false,
          inForm: !!formFields[fk],
          inTable: !!tableColumns[fk],
          tableVisible: tc.visible !== false,
        }
      })
      return {
        key, fields,
        label: pages[key]?.label || ENTITY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
        icon: pages[key]?.icon, path: pages[key]?.path, order: pages[key]?.order ?? 99,
        sidebar: pages[key]?.sidebar, pageRoles: pages[key]?.roles || [],
        tabs: pages[key]?.tabs || null, hasPerms: !!permissions[key], perms: permissions[key] || {},
        hasFields: allFieldKeys.size > 0,
      }
    }).sort((a, b) => a.order - b.order)
  }, [pages, permissions, forms, tables])

  const save = async (data) => {
    setSaving(true)
    try { await dispatch(updateSettings({ data, user })).unwrap() }
    catch (err) { showError('Failed to save: ' + (err || 'Unknown error')) }
    finally { setSaving(false) }
  }

  const applyPermNum = (resource, role, num) => {
    const p = { ...permissions[resource] }
    const set = (a, has) => { const arr = p[a] || []; p[a] = has ? (arr.includes(role) ? arr : [...arr, role]) : arr.filter(r => r !== role) }
    set('view', num & 4); set('create', num & 2); set('edit', num & 2); set('delete', num & 1)
    save({ permissions: { [resource]: p } })
  }

  const applyPageNum = (pk, role, num) => {
    const pg = pages[pk] || {}; const roles = pg.roles || []
    const nr = num >= 4 ? (roles.includes(role) ? roles : [...roles, role]) : roles.filter(r => r !== role)
    save({ pages: { [pk]: { roles: nr } } })
  }

  const toggleTabRole = (pk, tk, role) => {
    const tab = pages[pk]?.tabs?.[tk] || {}; const roles = tab.roles || []
    save({ pages: { [pk]: { tabs: { [tk]: { roles: roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role] } } } } })
  }

  const toggleSidebar = (pk) => { const pg = pages[pk] || {}; save({ pages: { [pk]: { sidebar: pg.sidebar === false ? true : false } } }) }

  // Unified field update — syncs both form + table
  const updateField = (entity, fieldKey, updates) => {
    const ff = { ...forms[entity]?.fields }; const tc = { ...tables[entity]?.columns }
    if (ff[fieldKey] || updates.inForm) {
      ff[fieldKey] = { ...ff[fieldKey], ...updates }
      delete ff[fieldKey].inForm; delete ff[fieldKey].inTable; delete ff[fieldKey].tableVisible; delete ff[fieldKey].searchable
      // Sync roles from perms: role has view (4+) = visible to that role
      if (updates.perms) {
        ff[fieldKey].roles = ROLES.filter(r => (updates.perms[r] ?? 6) >= 4)
      }
    }
    if (tc[fieldKey] || updates.inTable) {
      tc[fieldKey] = { ...tc[fieldKey] }
      if (updates.label !== undefined) tc[fieldKey].label = updates.label
      if (updates.roles !== undefined) tc[fieldKey].roles = updates.roles
      if (updates.searchable !== undefined) tc[fieldKey].searchable = updates.searchable
      if (updates.tableVisible !== undefined) tc[fieldKey].visible = updates.tableVisible
      // Sync roles from perms
      if (updates.perms) tc[fieldKey].roles = ROLES.filter(r => (updates.perms[r] ?? 6) >= 4)
    }
    const u = {}
    if (Object.keys(ff).length) u.forms = { ...forms, [entity]: { ...forms[entity], fields: ff } }
    if (Object.keys(tc).length) u.tables = { ...tables, [entity]: { ...tables[entity], columns: tc } }
    if (Object.keys(u).length) save(u)
  }

  const addField = (entity) => {
    const raw = newFieldKey.trim()
    if (!raw) return
    const key = raw.toLowerCase().replace(/\s+/g, '_')
    const label = raw.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const ff = { ...(forms[entity]?.fields || {}) }
    const tc = { ...(tables[entity]?.columns || {}) }
    if (ff[key] || tc[key]) { showError('Field already exists'); return }
    ff[key] = { label, type: addFieldType, visible: true, required: false, colSize: 6, placeholder: '' }
    if (TYPE_HAS_OPTIONS.has(addFieldType)) ff[key].options = []
    tc[key] = { label, visible: true, roles: [...ROLES], searchable: false }
    save({
      forms: { ...forms, [entity]: { ...forms[entity], fields: ff } },
      tables: { ...tables, [entity]: { ...tables[entity], columns: tc } },
    })
    setNewFieldKey('')
    setAddFieldType('text')
    setExpandedField(`${entity}:${key}`)
  }

  const removeField = (entity, fieldKey) => {
    const ff = { ...forms[entity]?.fields }; const tc = { ...tables[entity]?.columns }
    delete ff[fieldKey]; delete tc[fieldKey]
    save({ forms: { ...forms, [entity]: { ...forms[entity], fields: ff } }, tables: { ...tables, [entity]: { ...tables[entity], columns: tc } } })
  }

  const getCode = (perms, pr, hp) => ROLES.map(r => {
    const v = hp ? (perms.view || []).includes(r) : pr.includes(r)
    const w = hp && ((perms.create || []).includes(r) || (perms.edit || []).includes(r))
    const x = hp && (perms.delete || []).includes(r)
    return (v ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0)
  })

  return (
    <>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa', fontSize: '0.65rem' }}>
        <FaShieldAlt className="text-theme" size={9} />
        {saving && <span style={{ color: '#0891B2', fontWeight: 600 }}>Saving...</span>}
        <code style={{ color: '#16a34a' }}>4</code>=view <code style={{ color: '#2563eb' }}>2</code>=write <code style={{ color: '#dc2626' }}>1</code>=delete
        <span className="text-muted">| 7=rwx 6=rw- 4=r-- 0=---</span>
        {ROLES.map(r => <span key={r} style={{ color: RC[r], fontWeight: 700 }}>{RS[r]}</span>)}
      </div>

      <Accordion>
        {items.map(item => {
          const Icon = ICON_MAP[item.icon]
          const hasTabs = item.tabs && Object.keys(item.tabs).length > 0
          const code = getCode(item.perms, item.pageRoles, item.hasPerms)

          return (
            <Accordion.Item key={item.key} eventKey={item.key}>
              <Accordion.Header>
                <div className="d-flex align-items-center gap-2 w-100 pe-3" style={{ fontSize: '0.78rem' }}>
                  {Icon && <Icon size={11} className="text-theme" />}
                  <strong>{item.label}</strong>
                  <code className="ms-auto" style={{ fontSize: '0.7rem', color: '#475569', letterSpacing: 2, fontWeight: 700 }}>{code.join('')}</code>
                </div>
              </Accordion.Header>
              <Accordion.Body className="py-2 px-3">

                {/* PERMS */}
                <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
                  <small className="fw-bold text-muted" style={{ fontSize: '0.6rem' }}>PERMS</small>
                  {ROLES.map((role, i) => (
                    <PermNum key={role} role={role} value={code[i]} onChange={(v) => item.hasPerms ? applyPermNum(item.key, role, v) : applyPageNum(item.key, role, v)} />
                  ))}
                  {item.path && <label className="d-flex align-items-center gap-1" style={{ fontSize: '0.6rem', color: '#64748b' }}>
                    <Form.Check type="checkbox" checked={item.sidebar !== false} onChange={() => toggleSidebar(item.key)} /> sidebar
                  </label>}
                </div>

                {/* TABS */}
                {hasTabs && (
                  <div className="mb-2">
                    <small className="fw-bold text-muted" style={{ fontSize: '0.6rem' }}>TABS</small>
                    {Object.entries(item.tabs).map(([tk, tc]) => (
                      <div key={tk} className="d-flex align-items-center gap-2 mt-1 ps-2" style={{ borderLeft: '2px solid #e2e8f0', fontSize: '0.7rem' }}>
                        <span style={{ fontWeight: 500, minWidth: 70 }}>{tc.label || tk}</span>
                        {ROLES.map(r => <RoleBtn key={r} role={r} active={(tc.roles || []).includes(r)} onClick={() => toggleTabRole(item.key, tk, r)} />)}
                      </div>
                    ))}
                  </div>
                )}

                {/* FIELDS (unified form + table) */}
                {(item.hasFields || forms[item.key] || tables[item.key]) && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="fw-bold text-muted" style={{ fontSize: '0.6rem' }}>FIELDS</small>
                    </div>

                    {/* Column headers */}
                    <div className="d-flex align-items-center gap-1 py-1 px-1" style={{ fontSize: '0.55rem', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ width: 14 }}></span>
                      <span style={{ width: 18 }}>Vis</span>
                      <span style={{ flex: 1 }}>Field</span>
                      <span style={{ width: 46 }}>Type</span>
                      <span style={{ width: 18, textAlign: 'center' }}>Tbl</span>
                      <span style={{ width: 14, textAlign: 'center' }}>S</span>
                      {ROLES.map(r => <span key={r} style={{ width: 32, textAlign: 'center', color: RC[r], fontWeight: 700 }}>{RS[r]}</span>)}
                      <span style={{ width: 14 }}></span>
                    </div>

                    {Object.entries(item.fields).map(([fk, f]) => {
                      const isExp = expandedField === `${item.key}:${fk}`
                      const typeInfo = FIELD_TYPES.find(t => t.value === f.type)
                      return (
                        <div key={fk}>
                          <div className="d-flex align-items-center gap-1 py-1 px-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.68rem', cursor: 'pointer', backgroundColor: isExp ? '#f0f9ff' : 'transparent' }}
                            onClick={() => setExpandedField(isExp ? null : `${item.key}:${fk}`)}>
                            <span style={{ width: 14 }}>{isExp ? <FaChevronDown size={6} className="text-theme" /> : <FaChevronRight size={6} className="text-muted" />}</span>
                            <span style={{ width: 18 }} onClick={e => e.stopPropagation()}>
                              <Form.Check type="checkbox" checked={f.visible} onChange={() => updateField(item.key, fk, { visible: !f.visible })} />
                            </span>
                            <span style={{ flex: 1, color: f.visible ? '#334155' : '#94a3b8', fontWeight: 500 }}>
                              {f.label}{f.required && <span className="text-danger ms-1">*</span>}
                              {TYPE_HAS_OPTIONS.has(f.type) && f.options?.length > 0 && (
                                <Badge bg="light" text="muted" style={{ fontSize: '0.45rem', marginLeft: 4, fontWeight: 500 }}>{f.options.length} opts</Badge>
                              )}
                            </span>
                            <span style={{ width: 46 }}>
                              <span style={{ fontSize: '0.5rem', padding: '0 4px', backgroundColor: '#f1f5f9', borderRadius: 3, color: '#64748b', fontWeight: 500 }}>
                                {typeInfo?.icon || '?'} {f.type}
                              </span>
                            </span>
                            <span style={{ width: 18, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                              {f.inTable && <Form.Check type="checkbox" checked={f.tableVisible} onChange={() => updateField(item.key, fk, { tableVisible: !f.tableVisible })} />}
                            </span>
                            <span style={{ width: 14, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                              {f.inTable && <Form.Check type="checkbox" checked={f.searchable} onChange={() => updateField(item.key, fk, { searchable: !f.searchable })} />}
                            </span>
                            <div className="d-flex gap-1" onClick={e => e.stopPropagation()}>
                              {ROLES.map(r => {
                                const fieldPerms = f.perms || {}
                                const rp = fieldPerms[r] ?? (f.roles.includes(r) ? 6 : 0)
                                return (
                                  <PermNum key={r} role={r} value={rp} disabled={!f.visible}
                                    onChange={(v) => updateField(item.key, fk, { perms: { ...fieldPerms, [r]: v } })} />
                                )
                              })}
                            </div>
                            <span style={{ width: 16 }} onClick={e => e.stopPropagation()}>
                              <button type="button" className="btn p-0" onClick={() => removeField(item.key, fk)} style={{ fontSize: '0.5rem', color: '#dc2626', lineHeight: 1 }} title="Remove"><FaTrash size={7} /></button>
                            </span>
                          </div>

                          {isExp && (
                            <FieldEditor
                              field={f}
                              entityKey={item.key}
                              fieldKey={fk}
                              onUpdate={(updates) => updateField(item.key, fk, updates)}
                            />
                          )}
                        </div>
                      )
                    })}

                    {/* Add new field */}
                    <div className="d-flex align-items-center gap-1 mt-2 pt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <Form.Control size="sm" value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addField(item.key) } }}
                        placeholder="field_name" style={{ ...S.input, flex: 1, maxWidth: 140 }} />
                      <Form.Select size="sm" value={addFieldType} onChange={e => setAddFieldType(e.target.value)}
                        style={{ ...S.input, width: 100 }}>
                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </Form.Select>
                      <button type="button" className="btn btn-sm d-flex align-items-center gap-1"
                        onClick={() => addField(item.key)} disabled={!newFieldKey.trim()}
                        style={{ fontSize: '0.62rem', padding: '2px 10px', backgroundColor: newFieldKey.trim() ? '#0891B2' : '#e2e8f0', color: '#fff', borderRadius: 4, height: 24, whiteSpace: 'nowrap' }}>
                        <FaPlus size={8} /> Add Field
                      </button>
                    </div>
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>
          )
        })}
      </Accordion>

      {/* ===== NOTIFICATION CONTROLS ===== */}
      <div className="mt-3 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <FaBell className="text-theme" size={10} />
          <small className="fw-bold text-muted" style={{ fontSize: '0.65rem' }}>NOTIFICATION CONTROLS</small>
          {saving && <span style={{ color: '#0891B2', fontWeight: 600, fontSize: '0.6rem' }}>Saving...</span>}
        </div>

        {/* Header */}
        <div className="d-flex align-items-center gap-1 py-1 px-1 mb-1" style={{ fontSize: '0.55rem', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ width: 22 }}>On</span>
          <span style={{ flex: 1 }}>Type</span>
          {ROLES.map(r => <span key={r} style={{ width: 32, textAlign: 'center', color: RC[r], fontWeight: 700 }}>{RS[r]}</span>)}
        </div>

        {Object.entries(notifSettings).map(([type, config]) => {
          const enabled = config?.enabled !== false
          const roles = config?.roles || []
          const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

          const toggleEnabled = () => {
            save({ notifications: { [type]: { enabled: !enabled } } })
          }

          const toggleRole = (role) => {
            const newRoles = roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role]
            save({ notifications: { [type]: { roles: newRoles } } })
          }

          return (
            <div key={type} className="d-flex align-items-center gap-1 py-1 px-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.7rem', opacity: enabled ? 1 : 0.4 }}>
              <span style={{ width: 22 }}>
                <Form.Check type="checkbox" checked={enabled} onChange={toggleEnabled} />
              </span>
              <span style={{ flex: 1, fontWeight: 500, color: '#334155' }}>{label}</span>
              {ROLES.map(r => (
                <span key={r} style={{ width: 32, textAlign: 'center' }}>
                  <RoleBtn role={r} active={roles.includes(r)} onClick={() => toggleRole(r)} disabled={!enabled} />
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default PageControlTab
