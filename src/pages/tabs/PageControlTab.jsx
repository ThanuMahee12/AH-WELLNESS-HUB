import { useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Badge, Form, Accordion } from 'react-bootstrap'
import { FaShieldAlt, FaWpforms, FaTable, FaSearch } from 'react-icons/fa'
import { useSettings } from '../../hooks/useSettings'
import { updateSettings } from '../../store/settingsSlice'
import { useNotification } from '../../context'
import { ICON_MAP, ENTITY_LABELS } from '../../constants/defaultSettings'

const ROLES = ['superadmin', 'maintainer', 'editor', 'user']
const ROLE_SHORT = { superadmin: 'S', maintainer: 'M', editor: 'E', user: 'U' }
const ROLE_COLORS = { superadmin: '#ef4444', maintainer: '#f59e0b', editor: '#0891B2', user: '#64748b' }

const getStr = (n) => `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'}`

// Compact number input (0-7) with role label
const PermNum = ({ role, value, onChange, disabled }) => {
  const color = value === 7 ? '#16a34a' : value >= 4 ? '#d97706' : value > 0 ? '#dc2626' : '#94a3b8'
  return (
    <div className="d-flex align-items-center gap-0" title={`${role}: ${getStr(value)} (${value})`}>
      <span style={{ fontSize: '0.58rem', color: ROLE_COLORS[role], fontWeight: 700, width: 10 }}>{ROLE_SHORT[role]}</span>
      <input
        type="number" min="0" max="7"
        value={value}
        onChange={(e) => {
          const v = Math.max(0, Math.min(7, parseInt(e.target.value) || 0))
          onChange(v)
        }}
        disabled={disabled}
        style={{
          width: 22, height: 18,
          fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace',
          textAlign: 'center', padding: 0,
          border: `1px solid ${color}22`,
          borderRadius: 3,
          backgroundColor: `${color}11`,
          color,
          outline: 'none',
        }}
      />
    </div>
  )
}

function PageControlTab() {
  const dispatch = useDispatch()
  const { settings } = useSettings()
  const { error: showError } = useNotification()
  const [saving, setSaving] = useState(false)

  const pages = settings?.pages || {}
  const permissions = settings?.permissions || {}
  const forms = settings?.forms || {}
  const tables = settings?.tables || {}

  const items = useMemo(() => {
    const allKeys = new Set([
      ...Object.keys(pages).filter(k => k !== 'login' && k !== 'home'),
      ...Object.keys(permissions),
    ])
    return [...allKeys].map(key => ({
      key,
      label: pages[key]?.label || ENTITY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
      icon: pages[key]?.icon,
      path: pages[key]?.path,
      order: pages[key]?.order ?? 99,
      sidebar: pages[key]?.sidebar,
      pageRoles: pages[key]?.roles || [],
      tabs: pages[key]?.tabs || null,
      hasPerms: !!permissions[key],
      perms: permissions[key] || {},
      hasForm: !!forms[key],
      formFields: forms[key]?.fields || {},
      hasTable: !!tables[key],
      tableColumns: tables[key]?.columns || {},
      itemsPerPage: tables[key]?.itemsPerPage || 10,
    })).sort((a, b) => a.order - b.order)
  }, [pages, permissions, forms, tables])

  const save = async (updates) => {
    setSaving(true)
    try { await dispatch(updateSettings(updates)) }
    catch { showError('Failed to save') }
    finally { setSaving(false) }
  }

  // Apply a number (0-7) to a resource+role
  const applyPermNum = (resource, role, num) => {
    const perm = { ...permissions[resource] }
    const setRole = (action, has) => {
      const arr = perm[action] || []
      perm[action] = has ? (arr.includes(role) ? arr : [...arr, role]) : arr.filter(r => r !== role)
    }
    setRole('view', num & 4)
    setRole('create', num & 2)
    setRole('edit', num & 2)
    setRole('delete', num & 1)
    save({ permissions: { ...permissions, [resource]: perm } })
  }

  // Apply view-only (0 or 4) for page roles
  const applyPageNum = (pageKey, role, num) => {
    const page = pages[pageKey] || {}
    const hasView = num >= 4
    const roles = page.roles || []
    const newRoles = hasView ? (roles.includes(role) ? roles : [...roles, role]) : roles.filter(r => r !== role)
    save({ pages: { ...pages, [pageKey]: { ...page, roles: newRoles } } })
  }

  const toggleTabRole = (pageKey, tabKey, role) => {
    const page = pages[pageKey] || {}
    const tabs = page.tabs || {}
    const tab = tabs[tabKey] || {}
    const roles = tab.roles || []
    const newRoles = roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role]
    save({ pages: { ...pages, [pageKey]: { ...page, tabs: { ...tabs, [tabKey]: { ...tab, roles: newRoles } } } } })
  }

  const toggleSidebar = (pageKey) => {
    const page = pages[pageKey] || {}
    save({ pages: { ...pages, [pageKey]: { ...page, sidebar: page.sidebar === false ? true : false } } })
  }

  const toggleFormField = (entity, fieldKey, prop) => {
    const fields = { ...forms[entity]?.fields }
    fields[fieldKey] = { ...fields[fieldKey], [prop]: !fields[fieldKey]?.[prop] }
    save({ forms: { ...forms, [entity]: { ...forms[entity], fields } } })
  }

  const toggleFieldRole = (entity, fieldKey, role) => {
    const fields = { ...forms[entity]?.fields }
    const field = { ...fields[fieldKey] }
    const roles = field.roles || [...ROLES]
    field.roles = roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role]
    fields[fieldKey] = field
    save({ forms: { ...forms, [entity]: { ...forms[entity], fields } } })
  }

  const toggleTableColumn = (entity, colKey, prop) => {
    const columns = { ...tables[entity]?.columns }
    columns[colKey] = { ...columns[colKey], [prop]: !columns[colKey]?.[prop] }
    save({ tables: { ...tables, [entity]: { ...tables[entity], columns } } })
  }

  const toggleColumnRole = (entity, colKey, role) => {
    const columns = { ...tables[entity]?.columns }
    const col = { ...columns[colKey] }
    const roles = col.roles || [...ROLES]
    col.roles = roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role]
    columns[colKey] = col
    save({ tables: { ...tables, [entity]: { ...tables[entity], columns } } })
  }

  const updateItemsPerPage = (entity, value) => {
    save({ tables: { ...tables, [entity]: { ...tables[entity], itemsPerPage: parseInt(value) || 10 } } })
  }

  const getCode = (perms, pageRoles, hasPerms) => ROLES.map(role => {
    const r = hasPerms ? (perms.view || []).includes(role) : pageRoles.includes(role)
    const w = hasPerms && ((perms.create || []).includes(role) || (perms.edit || []).includes(role))
    const x = hasPerms && (perms.delete || []).includes(role)
    return (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0)
  })

  return (
    <>
      {/* Legend */}
      <div className="d-flex align-items-center gap-2 flex-wrap mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa', fontSize: '0.68rem' }}>
        <FaShieldAlt className="text-theme" size={10} />
        <code style={{ color: '#16a34a' }}>4</code>=view
        <code style={{ color: '#2563eb' }}>2</code>=write
        <code style={{ color: '#dc2626' }}>1</code>=delete
        <span className="text-muted">| 7=rwx 6=rw- 4=r-- 0=---</span>
        <span className="text-muted ms-1">
          {ROLES.map(r => <span key={r} className="me-1"><span style={{ color: ROLE_COLORS[r], fontWeight: 700 }}>{ROLE_SHORT[r]}</span>={r}</span>)}
        </span>
      </div>

      <Accordion>
        {items.map(item => {
          const Icon = ICON_MAP[item.icon]
          const hasTabs = item.tabs && Object.keys(item.tabs).length > 0
          const code = getCode(item.perms, item.pageRoles, item.hasPerms)
          const codeStr = code.join('')

          return (
            <Accordion.Item key={item.key} eventKey={item.key}>
              <Accordion.Header>
                <div className="d-flex align-items-center gap-2 w-100 pe-3" style={{ fontSize: '0.8rem' }}>
                  {Icon && <Icon size={12} className="text-theme" />}
                  <strong>{item.label}</strong>
                  <code className="ms-auto" style={{ fontSize: '0.72rem', color: '#475569', letterSpacing: 2, fontWeight: 700 }}>{codeStr}</code>
                </div>
              </Accordion.Header>
              <Accordion.Body className="py-2 px-3">

                {/* PERMISSIONS */}
                <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
                  <small className="fw-bold text-muted" style={{ fontSize: '0.62rem' }}>PERMS</small>
                  {ROLES.map((role, i) => (
                    <PermNum key={role} role={role} value={code[i]}
                      onChange={(v) => item.hasPerms ? applyPermNum(item.key, role, v) : applyPageNum(item.key, role, v)}
                      disabled={saving} />
                  ))}
                  {item.path && (
                    <label className="d-flex align-items-center gap-1" style={{ fontSize: '0.62rem', color: '#64748b', cursor: 'pointer' }}>
                      <Form.Check type="checkbox" checked={item.sidebar !== false} onChange={() => toggleSidebar(item.key)} disabled={saving} style={{ marginBottom: 0 }} />
                      sidebar
                    </label>
                  )}
                </div>

                {/* TABS */}
                {hasTabs && (
                  <div className="mb-2">
                    <small className="fw-bold text-muted" style={{ fontSize: '0.62rem' }}>TABS</small>
                    {Object.entries(item.tabs).map(([tabKey, tabCfg]) => (
                      <div key={tabKey} className="d-flex align-items-center gap-2 mt-1 ps-2" style={{ borderLeft: '2px solid #e2e8f0', fontSize: '0.7rem' }}>
                        <span style={{ fontWeight: 500, minWidth: 75 }}>{tabCfg.label || tabKey}</span>
                        {ROLES.map(role => {
                          const has = (tabCfg.roles || []).includes(role)
                          return (
                            <button key={role} type="button" onClick={() => toggleTabRole(item.key, tabKey, role)} disabled={saving}
                              style={{
                                fontSize: '0.55rem', padding: '0 4px', border: `1px solid ${has ? ROLE_COLORS[role] : '#e2e8f0'}`,
                                borderRadius: 3, backgroundColor: has ? ROLE_COLORS[role] : 'transparent',
                                color: has ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 600,
                              }}>
                              {ROLE_SHORT[role]}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* FORM FIELDS */}
                {item.hasForm && (
                  <div className="mb-2">
                    <small className="fw-bold text-muted" style={{ fontSize: '0.62rem' }}><FaWpforms size={8} className="me-1" />FORM</small>
                    {Object.entries(item.formFields).map(([fk, fc]) => {
                      const vis = fc.visible !== false
                      const roles = fc.roles || [...ROLES]
                      return (
                        <div key={fk} className="d-flex align-items-center gap-2 py-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.7rem' }}>
                          <Form.Check type="checkbox" checked={vis} onChange={() => toggleFormField(item.key, fk, 'visible')} disabled={saving} />
                          <span style={{ minWidth: 85, color: vis ? '#334155' : '#94a3b8', fontWeight: 500 }}>
                            {fc.label || fk}{fc.required && <span className="text-danger">*</span>}
                          </span>
                          <div className="d-flex gap-0 ms-auto">
                            {ROLES.map(role => {
                              const has = roles.includes(role)
                              return (
                                <button key={role} type="button" onClick={() => toggleFieldRole(item.key, fk, role)} disabled={saving || !vis}
                                  style={{
                                    fontSize: '0.5rem', padding: '0 3px', border: `1px solid ${has ? ROLE_COLORS[role] : '#e2e8f0'}`,
                                    borderRadius: 2, backgroundColor: has ? ROLE_COLORS[role] : 'transparent',
                                    color: has ? '#fff' : '#cbd5e1', fontWeight: 700, opacity: vis ? 1 : 0.3,
                                  }}>
                                  {ROLE_SHORT[role]}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* TABLE COLUMNS */}
                {item.hasTable && (
                  <div>
                    <div className="d-flex align-items-center gap-1">
                      <small className="fw-bold text-muted" style={{ fontSize: '0.62rem' }}><FaTable size={8} className="me-1" />TABLE</small>
                      <input type="number" value={item.itemsPerPage} onChange={(e) => updateItemsPerPage(item.key, e.target.value)}
                        style={{ width: 35, height: 16, fontSize: '0.6rem', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 2, padding: 0 }} />
                      <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>/pg</span>
                    </div>
                    {Object.entries(item.tableColumns).map(([ck, cc]) => {
                      const vis = cc.visible !== false
                      const roles = cc.roles || [...ROLES]
                      return (
                        <div key={ck} className="d-flex align-items-center gap-2 py-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.7rem' }}>
                          <Form.Check type="checkbox" checked={vis} onChange={() => toggleTableColumn(item.key, ck, 'visible')} disabled={saving} />
                          <span style={{ minWidth: 85, color: vis ? '#334155' : '#94a3b8', fontWeight: 500 }}>
                            {cc.label || ck}
                          </span>
                          <div className="d-flex align-items-center gap-0 ms-auto">
                            {cc.searchable && <FaSearch size={7} className="text-muted me-1" />}
                            {ROLES.map(role => {
                              const has = roles.includes(role)
                              return (
                                <button key={role} type="button" onClick={() => toggleColumnRole(item.key, ck, role)} disabled={saving || !vis}
                                  style={{
                                    fontSize: '0.5rem', padding: '0 3px', border: `1px solid ${has ? ROLE_COLORS[role] : '#e2e8f0'}`,
                                    borderRadius: 2, backgroundColor: has ? ROLE_COLORS[role] : 'transparent',
                                    color: has ? '#fff' : '#cbd5e1', fontWeight: 700, opacity: vis ? 1 : 0.3,
                                  }}>
                                  {ROLE_SHORT[role]}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
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
