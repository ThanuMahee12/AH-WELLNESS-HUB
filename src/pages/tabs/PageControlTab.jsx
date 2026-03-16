import { useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Accordion, Row, Col, Button } from 'react-bootstrap'
import { FaShieldAlt, FaChevronDown, FaChevronRight, FaPlus, FaTrash, FaSearch } from 'react-icons/fa'
import { useSettings } from '../../hooks/useSettings'
import { updateSettings } from '../../store/settingsSlice'
import { useNotification } from '../../context'
import { ICON_MAP, ENTITY_LABELS } from '../../constants/defaultSettings'

const ROLES = ['superadmin', 'maintainer', 'editor', 'user']
const RS = { superadmin: 'S', maintainer: 'M', editor: 'E', user: 'U' }
const RC = { superadmin: '#ef4444', maintainer: '#f59e0b', editor: '#0891B2', user: '#64748b' }

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

function PageControlTab() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const { error: showError } = useNotification()
  const [saving, setSaving] = useState(false)
  const [expandedField, setExpandedField] = useState(null)
  const [newFieldKey, setNewFieldKey] = useState('')

  const pages = settings?.pages || {}
  const permissions = settings?.permissions || {}
  const forms = settings?.forms || {}
  const tables = settings?.tables || {}

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
    if (!newFieldKey.trim()) return
    const key = newFieldKey.trim().toLowerCase().replace(/\s+/g, '_')
    const ff = { ...forms[entity]?.fields }; const tc = { ...tables[entity]?.columns }
    if (ff[key] || tc[key]) { showError('Field already exists'); return }
    ff[key] = { label: key.charAt(0).toUpperCase() + key.slice(1), type: 'text', visible: true, required: false, colSize: 6 }
    tc[key] = { label: ff[key].label, visible: true, roles: [...ROLES], searchable: false }
    save({ forms: { ...forms, [entity]: { ...forms[entity], fields: ff } }, tables: { ...tables, [entity]: { ...tables[entity], columns: tc } } })
    setNewFieldKey('')
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
                {item.hasFields && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="fw-bold text-muted" style={{ fontSize: '0.6rem' }}>FIELDS</small>
                    </div>

                    {/* Column headers */}
                    <div className="d-flex align-items-center gap-1 py-1 px-1" style={{ fontSize: '0.55rem', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ width: 14 }}></span>
                      <span style={{ width: 18 }}>Vis</span>
                      <span style={{ flex: 1 }}>Field</span>
                      <span style={{ width: 30 }}>Type</span>
                      <span style={{ width: 18, textAlign: 'center' }}>Tbl</span>
                      <span style={{ width: 14, textAlign: 'center' }}>🔍</span>
                      {ROLES.map(r => <span key={r} style={{ width: 32, textAlign: 'center', color: RC[r], fontWeight: 700 }}>{RS[r]}</span>)}
                      <span style={{ width: 14 }}></span>
                    </div>

                    {Object.entries(item.fields).map(([fk, f]) => {
                      const isExp = expandedField === `${item.key}:${fk}`
                      return (
                        <div key={fk}>
                          <div className="d-flex align-items-center gap-1 py-1 px-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.68rem', cursor: 'pointer' }}
                            onClick={() => setExpandedField(isExp ? null : `${item.key}:${fk}`)}>
                            <span style={{ width: 14 }}>{isExp ? <FaChevronDown size={6} className="text-muted" /> : <FaChevronRight size={6} className="text-muted" />}</span>
                            <span style={{ width: 18 }} onClick={e => e.stopPropagation()}>
                              <Form.Check type="checkbox" checked={f.visible} onChange={() => updateField(item.key, fk, { visible: !f.visible })} />
                            </span>
                            <span style={{ flex: 1, color: f.visible ? '#334155' : '#94a3b8', fontWeight: 500 }}>
                              {f.label}{f.required && <span className="text-danger">*</span>}
                            </span>
                            <span style={{ width: 30, fontSize: '0.52rem', color: '#94a3b8' }}>{f.type}</span>
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
                            <div className="ps-4 py-1 mb-1" style={{ backgroundColor: '#f8f9fa', borderRadius: 3, fontSize: '0.68rem' }}>
                              <Row className="g-1">
                                <Col xs={4}><label style={{ fontSize: '0.58rem', color: '#64748b' }}>Label</label>
                                  <Form.Control size="sm" value={f.label} onChange={e => updateField(item.key, fk, { label: e.target.value })} style={{ fontSize: '0.7rem', height: 22 }} /></Col>
                                <Col xs={3}><label style={{ fontSize: '0.58rem', color: '#64748b' }}>Type</label>
                                  <Form.Select size="sm" value={f.type} onChange={e => updateField(item.key, fk, { type: e.target.value })} style={{ fontSize: '0.65rem', height: 22 }}>
                                    {['text','number','email','tel','textarea','select','password','checkbox','date','richtext','custom','list'].map(t => <option key={t}>{t}</option>)}
                                  </Form.Select></Col>
                                <Col xs={2}><label style={{ fontSize: '0.58rem', color: '#64748b' }}>Width</label>
                                  <Form.Select size="sm" value={f.colSize} onChange={e => updateField(item.key, fk, { colSize: parseInt(e.target.value) })} style={{ fontSize: '0.65rem', height: 22 }}>
                                    <option value={6}>Half</option><option value={12}>Full</option>
                                  </Form.Select></Col>
                                <Col xs={3} className="d-flex align-items-end pb-1">
                                  <Form.Check type="checkbox" checked={f.required} onChange={() => updateField(item.key, fk, { required: !f.required })}
                                    label={<span style={{ fontSize: '0.6rem' }}>Req</span>} /></Col>
                              </Row>
                              <Row className="g-1 mt-1">
                                <Col xs={6}><label style={{ fontSize: '0.58rem', color: '#64748b' }}>Placeholder</label>
                                  <Form.Control size="sm" value={f.placeholder} onChange={e => updateField(item.key, fk, { placeholder: e.target.value })} style={{ fontSize: '0.7rem', height: 22 }} /></Col>
                                <Col xs={3} className="d-flex align-items-end pb-1">
                                  <Form.Check type="checkbox" checked={f.inTable} onChange={() => updateField(item.key, fk, { inTable: !f.inTable, tableVisible: true })}
                                    label={<span style={{ fontSize: '0.6rem' }}>Show in Table</span>} /></Col>
                                <Col xs={3} className="d-flex align-items-end pb-1">
                                  <Form.Check type="checkbox" checked={f.inForm} onChange={() => updateField(item.key, fk, { inForm: !f.inForm })}
                                    label={<span style={{ fontSize: '0.6rem' }}>Show in Form</span>} /></Col>
                              </Row>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Add new field */}
                    <div className="d-flex align-items-center gap-1 mt-1 pt-1" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <Form.Control size="sm" value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addField(item.key) } }}
                        placeholder="new_field_key" style={{ fontSize: '0.68rem', height: 22, maxWidth: 150 }} />
                      <button type="button" className="btn btn-sm" onClick={() => addField(item.key)}
                        style={{ fontSize: '0.6rem', padding: '1px 6px', backgroundColor: '#0891B2', color: '#fff', borderRadius: 3 }}>
                        <FaPlus size={8} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>
          )
        })}
      </Accordion>
    </>
  )
}

export default PageControlTab
