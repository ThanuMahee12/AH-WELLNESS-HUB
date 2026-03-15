import { useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Card, Badge, Form, Accordion, Row, Col } from 'react-bootstrap'
import { FaEye, FaEdit, FaTrash, FaShieldAlt, FaWpforms, FaTable, FaSearch } from 'react-icons/fa'
import { useSettings } from '../../hooks/useSettings'
import { updateSettings } from '../../store/settingsSlice'
import { useNotification } from '../../context'
import { ICON_MAP, ENTITY_LABELS } from '../../constants/defaultSettings'

const ROLES = ['superadmin', 'maintainer', 'editor', 'user']
const ROLE_SHORT = { superadmin: 'SA', maintainer: 'MT', editor: 'ED', user: 'US' }
const ROLE_COLORS = { superadmin: '#ef4444', maintainer: '#f59e0b', editor: '#0891B2', user: '#64748b' }

const getNum = (r, w, x) => (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0)
const getStr = (n) => `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'}`

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
      success('Updated')
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

  const toggleTableColumn = (entity, colKey, prop) => {
    const columns = { ...tables[entity]?.columns }
    columns[colKey] = { ...columns[colKey], [prop]: !columns[colKey]?.[prop] }
    save({ tables: { ...tables, [entity]: { ...tables[entity], columns } } })
  }

  const updateItemsPerPage = (entity, value) => {
    save({ tables: { ...tables, [entity]: { ...tables[entity], itemsPerPage: parseInt(value) || 10 } } })
  }

  const PermCode = ({ num }) => {
    const bg = num === 7 ? '#dcfce7' : num >= 4 ? '#fef3c7' : num > 0 ? '#fee2e2' : '#f1f5f9'
    const color = num === 7 ? '#16a34a' : num >= 4 ? '#d97706' : num > 0 ? '#dc2626' : '#94a3b8'
    return <code style={{ backgroundColor: bg, color, padding: '0 4px', borderRadius: 3, fontSize: '0.68rem', fontWeight: 600 }}>{getStr(num)}</code>
  }

  return (
    <>
      <div className="d-flex align-items-center gap-3 flex-wrap mb-3 p-2 rounded" style={{ backgroundColor: '#f8f9fa', fontSize: '0.72rem' }}>
        <FaShieldAlt className="text-theme" size={12} />
        <span><FaEye size={9} className="text-success me-1" /><code>r=4</code> View</span>
        <span><FaEdit size={9} className="text-primary me-1" /><code>w=2</code> Write</span>
        <span><FaTrash size={9} className="text-danger me-1" /><code>x=1</code> Delete</span>
        <span className="text-muted">7=rwx 6=rw- 4=r-- 0=---</span>
      </div>

      <Accordion>
        {items.map(item => {
          const Icon = ICON_MAP[item.icon]
          const hasTabs = item.tabs && Object.keys(item.tabs).length > 0
          const codeStr = ROLES.map(role => {
            const r = item.hasPerms ? (item.perms.view || []).includes(role) : item.pageRoles.includes(role)
            const w = item.hasPerms && ((item.perms.create || []).includes(role) || (item.perms.edit || []).includes(role))
            const x = item.hasPerms && (item.perms.delete || []).includes(role)
            return getNum(r, w, x)
          }).join('')

          return (
            <Accordion.Item key={item.key} eventKey={item.key}>
              <Accordion.Header>
                <div className="d-flex align-items-center gap-2 w-100 pe-3" style={{ fontSize: '0.82rem' }}>
                  {Icon && <Icon size={13} className="text-theme" />}
                  <strong>{item.label}</strong>
                  {item.path && <small className="text-muted" style={{ fontSize: '0.65rem' }}>{item.path}</small>}
                  <div className="ms-auto d-flex gap-1 align-items-center">
                    {item.hasForm && <Badge bg="light" text="dark" style={{ fontSize: '0.58rem' }}>Form</Badge>}
                    {item.hasTable && <Badge bg="light" text="dark" style={{ fontSize: '0.58rem' }}>Table</Badge>}
                    <code style={{ fontSize: '0.7rem', color: '#475569', letterSpacing: 1 }}>{codeStr}</code>
                  </div>
                </div>
              </Accordion.Header>
              <Accordion.Body className="py-2 px-3">

                {/* PERMISSIONS */}
                <small className="fw-bold text-muted d-block mb-1" style={{ fontSize: '0.68rem' }}>
                  <FaShieldAlt size={9} className="me-1" />PERMISSIONS
                </small>
                <table className="table table-sm mb-2" style={{ fontSize: '0.72rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '3px 6px', fontSize: '0.65rem', color: '#64748b', width: '22%' }}>ROLE</th>
                      <th style={{ padding: '3px 6px', fontSize: '0.65rem', color: '#16a34a', textAlign: 'center' }}>VIEW</th>
                      {item.hasPerms && <>
                        <th style={{ padding: '3px 6px', fontSize: '0.65rem', color: '#2563eb', textAlign: 'center' }}>WRITE</th>
                        <th style={{ padding: '3px 6px', fontSize: '0.65rem', color: '#dc2626', textAlign: 'center' }}>DEL</th>
                      </>}
                      <th style={{ padding: '3px 6px', fontSize: '0.65rem', color: '#64748b', textAlign: 'center' }}>CODE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROLES.map(role => {
                      const hasView = item.hasPerms ? (item.perms.view || []).includes(role) : item.pageRoles.includes(role)
                      const hasWrite = item.hasPerms && ((item.perms.create || []).includes(role) || (item.perms.edit || []).includes(role))
                      const hasDelete = item.hasPerms && (item.perms.delete || []).includes(role)
                      return (
                        <tr key={role}>
                          <td style={{ padding: '2px 6px' }}><Badge style={{ backgroundColor: ROLE_COLORS[role], fontSize: '0.6rem' }}>{role}</Badge></td>
                          <td style={{ padding: '2px 6px', textAlign: 'center' }}>
                            <Form.Check type="switch" checked={hasView} onChange={() => item.hasPerms ? togglePerm(item.key, 'view', role) : togglePageRole(item.key, role)} disabled={saving} />
                          </td>
                          {item.hasPerms && <>
                            <td style={{ padding: '2px 6px', textAlign: 'center' }}>
                              <Form.Check type="switch" checked={hasWrite} onChange={() => { togglePerm(item.key, 'create', role); togglePerm(item.key, 'edit', role) }} disabled={saving || !hasView} />
                            </td>
                            <td style={{ padding: '2px 6px', textAlign: 'center' }}>
                              <Form.Check type="switch" checked={hasDelete} onChange={() => togglePerm(item.key, 'delete', role)} disabled={saving || !hasView} />
                            </td>
                          </>}
                          <td style={{ padding: '2px 6px', textAlign: 'center' }}><PermCode num={getNum(hasView, hasWrite, hasDelete)} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* SIDEBAR + TABS */}
                <div className="d-flex flex-wrap gap-3 mb-2">
                  {item.path && <Form.Check type="switch" id={`sb-${item.key}`} label={<span style={{ fontSize: '0.72rem' }}>Sidebar</span>} checked={item.sidebar !== false} onChange={() => toggleSidebar(item.key)} disabled={saving} />}
                </div>
                {hasTabs && (
                  <div className="mb-2">
                    <small className="text-muted d-block mb-1" style={{ fontSize: '0.65rem' }}>TABS</small>
                    {Object.entries(item.tabs).map(([tabKey, tabCfg]) => (
                      <div key={tabKey} className="d-flex align-items-center gap-2 mb-1 ps-2" style={{ borderLeft: '2px solid #e2e8f0', fontSize: '0.72rem' }}>
                        <span style={{ fontWeight: 500, minWidth: 80 }}>{tabCfg.label || tabKey}</span>
                        {ROLES.map(role => (
                          <Form.Check key={role} type="switch" id={`t-${item.key}-${tabKey}-${role}`} inline
                            label={<span style={{ fontSize: '0.6rem', color: ROLE_COLORS[role] }}>{ROLE_SHORT[role]}</span>}
                            checked={(tabCfg.roles || []).includes(role)} onChange={() => toggleTabRole(item.key, tabKey, role)} disabled={saving} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* FORM FIELDS */}
                {item.hasForm && (
                  <div className="mb-2">
                    <small className="fw-bold text-muted d-block mb-1" style={{ fontSize: '0.68rem' }}>
                      <FaWpforms size={9} className="me-1" />FORM FIELDS
                    </small>
                    <div className="d-flex flex-wrap gap-1">
                      {Object.entries(item.formFields).map(([fieldKey, fieldCfg]) => (
                        <div key={fieldKey} className="d-flex align-items-center gap-1 px-2 py-1 rounded" style={{ border: '1px solid #e2e8f0', fontSize: '0.7rem' }}>
                          <Form.Check type="checkbox" id={`ff-${item.key}-${fieldKey}`}
                            checked={fieldCfg.visible !== false}
                            onChange={() => toggleFormField(item.key, fieldKey, 'visible')}
                            disabled={saving}
                            style={{ marginRight: 0 }}
                          />
                          <span style={{ color: fieldCfg.visible !== false ? '#334155' : '#94a3b8' }}>{fieldCfg.label || fieldKey}</span>
                          {fieldCfg.required && <span className="text-danger" style={{ fontSize: '0.6rem' }}>*</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TABLE COLUMNS */}
                {item.hasTable && (
                  <div className="mb-1">
                    <small className="fw-bold text-muted d-block mb-1" style={{ fontSize: '0.68rem' }}>
                      <FaTable size={9} className="me-1" />TABLE COLUMNS
                      <span className="ms-2 fw-normal">
                        <Form.Control size="sm" type="number" value={item.itemsPerPage} onChange={(e) => updateItemsPerPage(item.key, e.target.value)}
                          style={{ display: 'inline-block', width: 50, fontSize: '0.65rem', padding: '0 4px', height: 20 }} /> /page
                      </span>
                    </small>
                    <div className="d-flex flex-wrap gap-1">
                      {Object.entries(item.tableColumns).map(([colKey, colCfg]) => (
                        <div key={colKey} className="d-flex align-items-center gap-1 px-2 py-1 rounded" style={{ border: '1px solid #e2e8f0', fontSize: '0.7rem' }}>
                          <Form.Check type="checkbox" id={`tc-${item.key}-${colKey}`}
                            checked={colCfg.visible !== false}
                            onChange={() => toggleTableColumn(item.key, colKey, 'visible')}
                            disabled={saving}
                            style={{ marginRight: 0 }}
                          />
                          <span style={{ color: colCfg.visible !== false ? '#334155' : '#94a3b8' }}>{colCfg.label || colKey}</span>
                          {colCfg.searchable && <FaSearch size={8} className="text-muted" title="Searchable" />}
                        </div>
                      ))}
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
