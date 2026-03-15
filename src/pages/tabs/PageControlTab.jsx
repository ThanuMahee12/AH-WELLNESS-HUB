import { useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Badge, Form, Accordion } from 'react-bootstrap'
import { FaShieldAlt, FaWpforms, FaTable, FaSearch } from 'react-icons/fa'
import { useSettings } from '../../hooks/useSettings'
import { updateSettings } from '../../store/settingsSlice'
import { useNotification } from '../../context'
import { ICON_MAP, ENTITY_LABELS } from '../../constants/defaultSettings'

const ROLES = ['superadmin', 'maintainer', 'editor', 'user']
const ROLE_SHORT = { superadmin: 'SA', maintainer: 'MT', editor: 'ED', user: 'US' }
const ROLE_COLORS = { superadmin: '#ef4444', maintainer: '#f59e0b', editor: '#0891B2', user: '#64748b' }

// Compact permission toggle button
const PermBtn = ({ label, active, color, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      fontSize: '0.55rem',
      padding: '1px 4px',
      border: `1px solid ${active ? color : '#e2e8f0'}`,
      borderRadius: 3,
      backgroundColor: active ? color : 'transparent',
      color: active ? '#fff' : '#94a3b8',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 600,
      lineHeight: 1.4,
      opacity: disabled ? 0.4 : 1,
    }}
  >
    {label}
  </button>
)

// Role permission cell with r/w/x buttons
const RolePerms = ({ role, r, w, x, onToggle, disabled, showWrite = true, showDelete = true }) => (
  <div className="d-flex align-items-center gap-1">
    <span style={{ fontSize: '0.6rem', color: ROLE_COLORS[role], fontWeight: 600, minWidth: 16 }}>{ROLE_SHORT[role]}</span>
    <PermBtn label="r" active={r} color="#16a34a" onClick={() => onToggle('r')} disabled={disabled} />
    {showWrite && <PermBtn label="w" active={w} color="#2563eb" onClick={() => onToggle('w')} disabled={disabled || !r} />}
    {showDelete && <PermBtn label="x" active={x} color="#dc2626" onClick={() => onToggle('x')} disabled={disabled || !r} />}
  </div>
)

function PageControlTab() {
  const dispatch = useDispatch()
  const { settings } = useSettings()
  const { success, error: showError } = useNotification()
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
    try {
      await dispatch(updateSettings(updates))
    } catch {
      showError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const togglePerm = (resource, action, role) => {
    const current = permissions[resource]?.[action] || []
    const newRoles = current.includes(role) ? current.filter(r => r !== role) : [...current, role]
    let updates = { [action]: newRoles }
    if (action === 'view' && !newRoles.includes(role)) {
      updates.create = (permissions[resource]?.create || []).filter(r => r !== role)
      updates.edit = (permissions[resource]?.edit || []).filter(r => r !== role)
      updates.delete = (permissions[resource]?.delete || []).filter(r => r !== role)
    }
    if (action !== 'view' && newRoles.includes(role)) {
      const viewRoles = permissions[resource]?.view || []
      if (!viewRoles.includes(role)) updates.view = [...viewRoles, role]
    }
    save({ permissions: { ...permissions, [resource]: { ...permissions[resource], ...updates } } })
  }

  const togglePageRole = (pageKey, role) => {
    const page = pages[pageKey] || {}
    const newRoles = (page.roles || []).includes(role) ? (page.roles || []).filter(r => r !== role) : [...(page.roles || []), role]
    const updates = { pages: { ...pages, [pageKey]: { ...page, roles: newRoles } } }
    if (permissions[pageKey]) {
      const perm = { ...permissions[pageKey], view: newRoles }
      const removed = (page.roles || []).filter(r => !newRoles.includes(r))
      if (removed.length) { ['create', 'edit', 'delete'].forEach(a => { perm[a] = (perm[a] || []).filter(r => !removed.includes(r)) }) }
      updates.permissions = { ...permissions, [pageKey]: perm }
    }
    save(updates)
  }

  const toggleTabRole = (pageKey, tabKey, role) => {
    const page = pages[pageKey] || {}
    const tabs = page.tabs || {}
    const tab = tabs[tabKey] || {}
    const newRoles = (tab.roles || []).includes(role) ? (tab.roles || []).filter(r => r !== role) : [...(tab.roles || []), role]
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

  const getPermCode = (perms, pageRoles, hasPerms) => {
    return ROLES.map(role => {
      const r = hasPerms ? (perms.view || []).includes(role) : pageRoles.includes(role)
      const w = hasPerms && ((perms.create || []).includes(role) || (perms.edit || []).includes(role))
      const x = hasPerms && (perms.delete || []).includes(role)
      return (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0)
    }).join('')
  }

  return (
    <>
      {/* Legend */}
      <div className="d-flex align-items-center gap-2 flex-wrap mb-3 p-2 rounded" style={{ backgroundColor: '#f8f9fa', fontSize: '0.68rem' }}>
        <FaShieldAlt className="text-theme" size={10} />
        <PermBtn label="r" active color="#16a34a" onClick={() => {}} /> View
        <PermBtn label="w" active color="#2563eb" onClick={() => {}} /> Write
        <PermBtn label="x" active color="#dc2626" onClick={() => {}} /> Delete
        <span className="text-muted">| 7=rwx 6=rw- 4=r-- 0=---</span>
      </div>

      <Accordion>
        {items.map(item => {
          const Icon = ICON_MAP[item.icon]
          const hasTabs = item.tabs && Object.keys(item.tabs).length > 0
          const code = getPermCode(item.perms, item.pageRoles, item.hasPerms)

          return (
            <Accordion.Item key={item.key} eventKey={item.key}>
              <Accordion.Header>
                <div className="d-flex align-items-center gap-2 w-100 pe-3" style={{ fontSize: '0.8rem' }}>
                  {Icon && <Icon size={12} className="text-theme" />}
                  <strong>{item.label}</strong>
                  {item.path && <small className="text-muted" style={{ fontSize: '0.62rem' }}>{item.path}</small>}
                  <div className="ms-auto d-flex gap-1 align-items-center">
                    {item.hasForm && <Badge bg="light" text="dark" style={{ fontSize: '0.55rem' }}>F</Badge>}
                    {item.hasTable && <Badge bg="light" text="dark" style={{ fontSize: '0.55rem' }}>T</Badge>}
                    <code style={{ fontSize: '0.68rem', color: '#475569', letterSpacing: 1 }}>{code}</code>
                  </div>
                </div>
              </Accordion.Header>
              <Accordion.Body className="py-2 px-3">

                {/* RESOURCE PERMISSIONS */}
                <div className="mb-2">
                  <small className="fw-bold text-muted" style={{ fontSize: '0.65rem' }}><FaShieldAlt size={8} className="me-1" />PERMISSIONS</small>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {ROLES.map(role => {
                      const hasView = item.hasPerms ? (item.perms.view || []).includes(role) : item.pageRoles.includes(role)
                      const hasWrite = item.hasPerms && ((item.perms.create || []).includes(role) || (item.perms.edit || []).includes(role))
                      const hasDelete = item.hasPerms && (item.perms.delete || []).includes(role)
                      return (
                        <RolePerms key={role} role={role} r={hasView} w={hasWrite} x={hasDelete}
                          showWrite={item.hasPerms} showDelete={item.hasPerms}
                          onToggle={(type) => {
                            if (type === 'r') item.hasPerms ? togglePerm(item.key, 'view', role) : togglePageRole(item.key, role)
                            if (type === 'w') { togglePerm(item.key, 'create', role); togglePerm(item.key, 'edit', role) }
                            if (type === 'x') togglePerm(item.key, 'delete', role)
                          }}
                          disabled={saving}
                        />
                      )
                    })}
                    {item.path && (
                      <div className="d-flex align-items-center gap-1 ms-2">
                        <Form.Check type="switch" id={`sb-${item.key}`} checked={item.sidebar !== false} onChange={() => toggleSidebar(item.key)} disabled={saving} style={{ marginBottom: 0 }} />
                        <span style={{ fontSize: '0.62rem', color: '#64748b' }}>Sidebar</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TABS */}
                {hasTabs && (
                  <div className="mb-2">
                    <small className="fw-bold text-muted" style={{ fontSize: '0.65rem' }}>TABS</small>
                    {Object.entries(item.tabs).map(([tabKey, tabCfg]) => (
                      <div key={tabKey} className="d-flex align-items-center gap-2 mt-1 ps-2" style={{ borderLeft: '2px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, minWidth: 75 }}>{tabCfg.label || tabKey}</span>
                        <div className="d-flex gap-1">
                          {ROLES.map(role => (
                            <PermBtn key={role} label={ROLE_SHORT[role]} active={(tabCfg.roles || []).includes(role)} color={ROLE_COLORS[role]}
                              onClick={() => toggleTabRole(item.key, tabKey, role)} disabled={saving} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FORM FIELDS */}
                {item.hasForm && (
                  <div className="mb-2">
                    <small className="fw-bold text-muted" style={{ fontSize: '0.65rem' }}><FaWpforms size={8} className="me-1" />FORM FIELDS</small>
                    <div className="mt-1">
                      {Object.entries(item.formFields).map(([fieldKey, fieldCfg]) => {
                        const fieldRoles = fieldCfg.roles || [...ROLES]
                        const isVisible = fieldCfg.visible !== false
                        return (
                          <div key={fieldKey} className="d-flex align-items-center gap-2 py-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.72rem' }}>
                            <Form.Check type="checkbox" checked={isVisible} onChange={() => toggleFormField(item.key, fieldKey, 'visible')} disabled={saving} style={{ marginRight: 0 }} />
                            <span style={{ minWidth: 90, color: isVisible ? '#334155' : '#94a3b8', fontWeight: 500 }}>
                              {fieldCfg.label || fieldKey}
                              {fieldCfg.required && <span className="text-danger ms-1" style={{ fontSize: '0.6rem' }}>*</span>}
                            </span>
                            <div className="d-flex gap-1 ms-auto">
                              {ROLES.map(role => (
                                <PermBtn key={role} label={ROLE_SHORT[role]} active={fieldRoles.includes(role)} color={ROLE_COLORS[role]}
                                  onClick={() => toggleFieldRole(item.key, fieldKey, role)} disabled={saving || !isVisible} />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* TABLE COLUMNS */}
                {item.hasTable && (
                  <div className="mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <small className="fw-bold text-muted" style={{ fontSize: '0.65rem' }}><FaTable size={8} className="me-1" />TABLE</small>
                      <Form.Control size="sm" type="number" value={item.itemsPerPage} onChange={(e) => updateItemsPerPage(item.key, e.target.value)}
                        style={{ width: 45, fontSize: '0.62rem', padding: '0 3px', height: 18, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>/page</span>
                    </div>
                    <div className="mt-1">
                      {Object.entries(item.tableColumns).map(([colKey, colCfg]) => {
                        const colRoles = colCfg.roles || [...ROLES]
                        const isVisible = colCfg.visible !== false
                        return (
                          <div key={colKey} className="d-flex align-items-center gap-2 py-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.72rem' }}>
                            <Form.Check type="checkbox" checked={isVisible} onChange={() => toggleTableColumn(item.key, colKey, 'visible')} disabled={saving} style={{ marginRight: 0 }} />
                            <span style={{ minWidth: 90, color: isVisible ? '#334155' : '#94a3b8', fontWeight: 500 }}>
                              {colCfg.label || colKey}
                            </span>
                            <div className="d-flex align-items-center gap-1 ms-auto">
                              {colCfg.searchable && <FaSearch size={7} className="text-muted" />}
                              {ROLES.map(role => (
                                <PermBtn key={role} label={ROLE_SHORT[role]} active={colRoles.includes(role)} color={ROLE_COLORS[role]}
                                  onClick={() => toggleColumnRole(item.key, colKey, role)} disabled={saving || !isVisible} />
                              ))}
                            </div>
                          </div>
                        )
                      })}
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
