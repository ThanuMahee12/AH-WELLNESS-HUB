import { useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Card, Badge, Form, Accordion } from 'react-bootstrap'
import { FaEye, FaEdit, FaTrash, FaShieldAlt } from 'react-icons/fa'
import { useSettings } from '../../hooks/useSettings'
import { updateSettings } from '../../store/settingsSlice'
import { useNotification } from '../../context'
import { ICON_MAP } from '../../constants/defaultSettings'

const ROLES = ['superadmin', 'maintainer', 'editor', 'user']
const ROLE_SHORT = { superadmin: 'SA', maintainer: 'MT', editor: 'ED', user: 'US' }
const ROLE_COLORS = { superadmin: '#ef4444', maintainer: '#f59e0b', editor: '#0891B2', user: '#64748b' }

// Unix permission helpers
const getNum = (r, w, x) => (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0)
const getStr = (n) => `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'}`

function PageControlTab() {
  const dispatch = useDispatch()
  const { settings } = useSettings()
  const { success, error: showError } = useNotification()
  const [saving, setSaving] = useState(false)

  const pages = settings?.pages || {}
  const permissions = settings?.permissions || {}

  // Merge pages and permissions into unified list
  const items = useMemo(() => {
    const allKeys = new Set([
      ...Object.keys(pages).filter(k => k !== 'login' && k !== 'home'),
      ...Object.keys(permissions),
    ])

    return [...allKeys].map(key => {
      const page = pages[key]
      const perm = permissions[key]
      return {
        key,
        label: page?.label || key.charAt(0).toUpperCase() + key.slice(1),
        icon: page?.icon,
        path: page?.path,
        order: page?.order ?? 99,
        sidebar: page?.sidebar,
        pageRoles: page?.roles || [],
        tabs: page?.tabs || null,
        hasPerms: !!perm,
        perms: perm || {},
      }
    }).sort((a, b) => a.order - b.order)
  }, [pages, permissions])

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

  // Toggle a role in a permission action array
  const togglePerm = (resource, action, role) => {
    const current = permissions[resource]?.[action] || []
    const newRoles = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role]

    // If toggling view off, also remove create/edit/delete
    let updates = { [action]: newRoles }
    if (action === 'view' && !newRoles.includes(role)) {
      updates.create = (permissions[resource]?.create || []).filter(r => r !== role)
      updates.edit = (permissions[resource]?.edit || []).filter(r => r !== role)
      updates.delete = (permissions[resource]?.delete || []).filter(r => r !== role)
    }
    // If toggling create/edit/delete on, auto-add view
    if (action !== 'view' && newRoles.includes(role)) {
      const viewRoles = permissions[resource]?.view || []
      if (!viewRoles.includes(role)) {
        updates.view = [...viewRoles, role]
      }
    }

    save({
      permissions: {
        ...permissions,
        [resource]: { ...permissions[resource], ...updates }
      }
    })
  }

  // Toggle page role (also syncs with view permission if exists)
  const togglePageRole = (pageKey, role) => {
    const page = pages[pageKey] || {}
    const currentRoles = page.roles || []
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role]

    const updates = {
      pages: { ...pages, [pageKey]: { ...page, roles: newRoles } }
    }

    // Sync with permissions view if resource exists
    if (permissions[pageKey]) {
      updates.permissions = {
        ...permissions,
        [pageKey]: {
          ...permissions[pageKey],
          view: newRoles,
        }
      }
      // Remove write/delete for roles that lost view
      const removedRoles = currentRoles.filter(r => !newRoles.includes(r))
      if (removedRoles.length > 0) {
        const perm = { ...permissions[pageKey] }
        ;['create', 'edit', 'delete'].forEach(action => {
          perm[action] = (perm[action] || []).filter(r => !removedRoles.includes(r))
        })
        updates.permissions[pageKey] = perm
      }
    }

    save(updates)
  }

  const toggleTabRole = (pageKey, tabKey, role) => {
    const page = pages[pageKey] || {}
    const tabs = page.tabs || {}
    const tab = tabs[tabKey] || {}
    const currentRoles = tab.roles || []
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role]

    save({
      pages: {
        ...pages,
        [pageKey]: { ...page, tabs: { ...tabs, [tabKey]: { ...tab, roles: newRoles } } }
      }
    })
  }

  const toggleSidebar = (pageKey) => {
    const page = pages[pageKey] || {}
    save({ pages: { ...pages, [pageKey]: { ...page, sidebar: page.sidebar === false ? true : false } } })
  }

  const PermCode = ({ num }) => {
    const bg = num === 7 ? '#dcfce7' : num >= 4 ? '#fef3c7' : num > 0 ? '#fee2e2' : '#f1f5f9'
    const color = num === 7 ? '#16a34a' : num >= 4 ? '#d97706' : num > 0 ? '#dc2626' : '#94a3b8'
    return <code style={{ backgroundColor: bg, color, padding: '0 4px', borderRadius: 3, fontSize: '0.68rem', fontWeight: 600 }}>{getStr(num)}</code>
  }

  return (
    <>
      {/* Legend */}
      <div className="d-flex align-items-center gap-3 flex-wrap mb-3 p-2 rounded" style={{ backgroundColor: '#f8f9fa', fontSize: '0.72rem' }}>
        <FaShieldAlt className="text-theme" size={12} />
        <span><FaEye size={9} className="text-success me-1" /><code>r=4</code> View (page + table)</span>
        <span><FaEdit size={9} className="text-primary me-1" /><code>w=2</code> Write (create + edit)</span>
        <span><FaTrash size={9} className="text-danger me-1" /><code>x=1</code> Execute (delete)</span>
        <span className="text-muted">7=rwx 6=rw- 4=r-- 0=---</span>
      </div>

      <Accordion defaultActiveKey="">
        {items.map(item => {
          const Icon = ICON_MAP[item.icon]
          const hasTabs = item.tabs && Object.keys(item.tabs).length > 0

          // Build permission code string
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
                  {item.path && <small className="text-muted" style={{ fontSize: '0.68rem' }}>{item.path}</small>}
                  <div className="ms-auto d-flex align-items-center gap-1">
                    <code style={{ fontSize: '0.72rem', color: '#475569', letterSpacing: '1px' }}>{codeStr}</code>
                  </div>
                </div>
              </Accordion.Header>
              <Accordion.Body className="py-2 px-3">
                {/* Permission Matrix */}
                <table className="table table-sm mb-2" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '4px 8px', fontSize: '0.68rem', color: '#64748b', width: '20%' }}>ROLE</th>
                      <th style={{ padding: '4px 8px', fontSize: '0.68rem', color: '#16a34a', textAlign: 'center' }}>
                        <FaEye size={9} /> VIEW
                      </th>
                      {item.hasPerms && (
                        <>
                          <th style={{ padding: '4px 8px', fontSize: '0.68rem', color: '#2563eb', textAlign: 'center' }}>
                            <FaEdit size={9} /> WRITE
                          </th>
                          <th style={{ padding: '4px 8px', fontSize: '0.68rem', color: '#dc2626', textAlign: 'center' }}>
                            <FaTrash size={9} /> DELETE
                          </th>
                        </>
                      )}
                      <th style={{ padding: '4px 8px', fontSize: '0.68rem', color: '#64748b', textAlign: 'center' }}>CODE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROLES.map(role => {
                      const hasView = item.hasPerms ? (item.perms.view || []).includes(role) : item.pageRoles.includes(role)
                      const hasWrite = item.hasPerms && ((item.perms.create || []).includes(role) || (item.perms.edit || []).includes(role))
                      const hasDelete = item.hasPerms && (item.perms.delete || []).includes(role)
                      const num = getNum(hasView, hasWrite, hasDelete)
                      return (
                        <tr key={role}>
                          <td style={{ padding: '4px 8px' }}>
                            <Badge style={{ backgroundColor: ROLE_COLORS[role], fontSize: '0.65rem' }}>{ROLE_SHORT[role]} {role}</Badge>
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                            <Form.Check type="switch" checked={hasView}
                              onChange={() => item.hasPerms ? togglePerm(item.key, 'view', role) : togglePageRole(item.key, role)}
                              disabled={saving || (role === 'superadmin' && item.hasPerms)} />
                          </td>
                          {item.hasPerms && (
                            <>
                              <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                <Form.Check type="switch" checked={hasWrite}
                                  onChange={() => { togglePerm(item.key, 'create', role); togglePerm(item.key, 'edit', role) }}
                                  disabled={saving || !hasView} />
                              </td>
                              <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                <Form.Check type="switch" checked={hasDelete}
                                  onChange={() => togglePerm(item.key, 'delete', role)}
                                  disabled={saving || !hasView} />
                              </td>
                            </>
                          )}
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}><PermCode num={num} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Sidebar + Tabs */}
                <div className="d-flex flex-wrap gap-3 align-items-start">
                  {item.path && (
                    <Form.Check type="switch" id={`sb-${item.key}`}
                      label={<span style={{ fontSize: '0.72rem' }}>Sidebar</span>}
                      checked={item.sidebar !== false}
                      onChange={() => toggleSidebar(item.key)}
                      disabled={saving} />
                  )}
                </div>

                {hasTabs && (
                  <div className="mt-2">
                    <small className="text-muted d-block mb-1" style={{ fontSize: '0.68rem' }}>TABS</small>
                    {Object.entries(item.tabs).map(([tabKey, tabConfig]) => (
                      <div key={tabKey} className="d-flex align-items-center gap-2 mb-1 ps-2" style={{ borderLeft: '2px solid #e2e8f0', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 500, minWidth: 90 }}>{tabConfig.label || tabKey}</span>
                        {ROLES.map(role => (
                          <Form.Check key={role} type="switch" id={`t-${item.key}-${tabKey}-${role}`} inline
                            label={<span style={{ fontSize: '0.62rem', color: ROLE_COLORS[role] }}>{ROLE_SHORT[role]}</span>}
                            checked={(tabConfig.roles || []).includes(role)}
                            onChange={() => toggleTabRole(item.key, tabKey, role)}
                            disabled={saving} />
                        ))}
                      </div>
                    ))}
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
