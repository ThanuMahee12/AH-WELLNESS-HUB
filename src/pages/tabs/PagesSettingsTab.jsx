import { useSelector, useDispatch } from 'react-redux'
import { Card, Table, Form } from 'react-bootstrap'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { ALL_ROLES, PERMISSION_ACTIONS, PERMISSION_RESOURCES, ENTITY_LABELS, ICON_MAP, ICON_OPTIONS } from '../../constants/defaultSettings'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function PagesSettingsTab() {
  const dispatch = useDispatch()
  const { settings, loading } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { error: showError } = useNotification()

  const pages = settings?.pages
  const permissions = settings?.permissions

  if (loading) {
    return <LoadingSpinner text="Loading settings..." />
  }

  if (!pages) return null

  // Sort pages by order for display, exclude non-sidebar pages like home
  const sortedPages = Object.entries(pages)
    .filter(([, cfg]) => cfg.sidebar !== false)
    .sort(([, a], [, b]) => (a.order ?? 99) - (b.order ?? 99))

  const handleToggle = async (pageKey, role, checked) => {
    const currentRoles = pages[pageKey]?.roles || []
    const newRoles = checked
      ? [...currentRoles, role]
      : currentRoles.filter(r => r !== role)

    try {
      await dispatch(updateSettings({
        data: {
          pages: {
            [pageKey]: { roles: newRoles },
          },
        },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update setting: ' + (err || 'Unknown error'))
    }
  }

  const handlePageFieldChange = async (pageKey, field, value) => {
    try {
      await dispatch(updateSettings({
        data: {
          pages: {
            [pageKey]: { [field]: value },
          },
        },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update setting: ' + (err || 'Unknown error'))
    }
  }

  // Pages that have sub-tabs
  const pagesWithTabs = Object.entries(pages).filter(([, cfg]) => cfg.tabs)

  const handleTabToggle = async (pageKey, tabKey, role, checked) => {
    const currentRoles = pages[pageKey]?.tabs?.[tabKey]?.roles || []
    const newRoles = checked
      ? [...currentRoles, role]
      : currentRoles.filter(r => r !== role)

    try {
      await dispatch(updateSettings({
        data: {
          pages: {
            [pageKey]: { tabs: { [tabKey]: { roles: newRoles } } },
          },
        },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update tab access: ' + (err || 'Unknown error'))
    }
  }

  const handlePermissionToggle = async (resource, action, role, checked) => {
    const currentRoles = permissions?.[resource]?.[action] || []
    const newRoles = checked
      ? [...currentRoles, role]
      : currentRoles.filter(r => r !== role)

    try {
      await dispatch(updateSettings({
        data: {
          permissions: {
            [resource]: { [action]: newRoles },
          },
        },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update permission: ' + (err || 'Unknown error'))
    }
  }

  return (
    <>
      <Card className="shadow-sm mb-4">
        <Card.Header className="card-header-theme">
          <h5 className="mb-0 fs-responsive-md">Page Access &amp; Sidebar Config</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 table-mobile-responsive align-middle">
              <thead className="bg-theme-slate">
                <tr>
                  <th style={{ minWidth: 120 }}>Label</th>
                  <th style={{ minWidth: 150 }}>Icon</th>
                  <th style={{ width: 70, textAlign: 'center' }}>Order</th>
                  {ALL_ROLES.map(role => (
                    <th key={role} style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPages.map(([pageKey, cfg]) => {
                  const IconComp = ICON_MAP[cfg.icon]
                  const isSettingsPage = pageKey === 'settings'

                  return (
                    <tr key={pageKey}>
                      <td data-label="Label">
                        <Form.Control
                          size="sm"
                          type="text"
                          value={cfg.label || ''}
                          disabled={isSettingsPage}
                          onChange={(e) => handlePageFieldChange(pageKey, 'label', e.target.value)}
                          style={{ minWidth: 100 }}
                        />
                      </td>
                      <td data-label="Icon">
                        <div className="d-flex align-items-center gap-2">
                          {IconComp && <IconComp style={{ fontSize: '1.1rem', color: '#0891B2' }} />}
                          <Form.Select
                            size="sm"
                            value={cfg.icon || ''}
                            onChange={(e) => handlePageFieldChange(pageKey, 'icon', e.target.value)}
                            style={{ minWidth: 130 }}
                          >
                            {ICON_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </Form.Select>
                        </div>
                      </td>
                      <td data-label="Order" style={{ textAlign: 'center' }}>
                        <Form.Control
                          size="sm"
                          type="number"
                          min={1}
                          value={cfg.order ?? ''}
                          onChange={(e) => handlePageFieldChange(pageKey, 'order', parseInt(e.target.value, 10) || 1)}
                          style={{ width: 60, margin: '0 auto' }}
                        />
                      </td>
                      {ALL_ROLES.map(role => {
                        const isChecked = cfg.roles?.includes(role) ?? false
                        const isLocked = isSettingsPage && role === 'superadmin'

                        return (
                          <td key={role} data-label={role} style={{ textAlign: 'center' }}>
                            <Form.Check
                              type="switch"
                              checked={isChecked}
                              disabled={isLocked}
                              onChange={(e) => handleToggle(pageKey, role, e.target.checked)}
                              className="d-inline-block"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Login Page Controls */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="card-header-theme">
          <h5 className="mb-0 fs-responsive-md">Login Page Controls</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover size="sm" className="mb-0 table-mobile-responsive align-middle">
              <thead className="bg-theme-slate">
                <tr>
                  <th style={{ width: '25%' }}>Feature</th>
                  {ALL_ROLES.map(role => (
                    <th key={role} style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'showResetPassword', label: 'Reset Password' },
                  { key: 'showSignUp', label: 'Sign Up' },
                ].map(({ key, label }) => {
                  const currentRoles = Array.isArray(pages?.login?.[key]) ? pages.login[key] : ALL_ROLES
                  return (
                    <tr key={key}>
                      <td data-label="Feature"><strong>{label}</strong></td>
                      {ALL_ROLES.map(role => (
                        <td key={role} data-label={role} style={{ textAlign: 'center' }}>
                          <Form.Check
                            type="switch"
                            checked={currentRoles.includes(role)}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...currentRoles, role]
                                : currentRoles.filter(r => r !== role)
                              handlePageFieldChange('login', key, newRoles)
                            }}
                            className="d-inline-block"
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {pagesWithTabs.length > 0 && (
        <>
          <h5 className="mb-3 mt-4 fs-responsive-md">Tab Access by Role</h5>
          {pagesWithTabs.map(([pageKey, cfg]) => (
            <Card key={pageKey} className="shadow-sm mb-3">
              <Card.Header className="card-header-theme py-2">
                <h6 className="mb-0 fs-responsive-sm">{cfg.label || pageKey} — Tabs</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover size="sm" className="mb-0 table-mobile-responsive align-middle">
                    <thead className="bg-theme-slate">
                      <tr>
                        <th style={{ width: '25%' }}>Tab</th>
                        {ALL_ROLES.map(role => (
                          <th key={role} style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(cfg.tabs || {}).map(([tabKey, tabCfg]) => (
                        <tr key={tabKey}>
                          <td data-label="Tab">
                            <strong>{tabCfg.label || tabKey}</strong>
                          </td>
                          {ALL_ROLES.map(role => {
                            const isChecked = tabCfg.roles?.includes(role) ?? false
                            const isLocked = role === 'superadmin'
                            return (
                              <td key={role} data-label={role} style={{ textAlign: 'center' }}>
                                <Form.Check
                                  type="switch"
                                  checked={isLocked || isChecked}
                                  disabled={isLocked}
                                  onChange={(e) => handleTabToggle(pageKey, tabKey, role, e.target.checked)}
                                  className="d-inline-block"
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          ))}
        </>
      )}

      <h5 className="mb-3 mt-4 fs-responsive-md">Feature Permissions by Role</h5>

      {PERMISSION_RESOURCES.map(resource => (
        <Card key={resource} className="shadow-sm mb-3">
          <Card.Header className="card-header-theme py-2">
            <h6 className="mb-0 fs-responsive-sm">{ENTITY_LABELS[resource] || resource}</h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0 table-mobile-responsive align-middle">
                <thead className="bg-theme-slate">
                  <tr>
                    <th style={{ width: '25%' }}>Action</th>
                    {ALL_ROLES.map(role => (
                      <th key={role} style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_ACTIONS.map(action => {
                    const rolesWithPerm = permissions?.[resource]?.[action] || []
                    return (
                      <tr key={action}>
                        <td data-label="Action" style={{ textTransform: 'capitalize' }}>
                          <strong>{action}</strong>
                        </td>
                        {ALL_ROLES.map(role => {
                          const isChecked = rolesWithPerm.includes(role)
                          const isLocked = role === 'superadmin'
                          return (
                            <td key={role} data-label={role} style={{ textAlign: 'center' }}>
                              <Form.Check
                                type="switch"
                                checked={isLocked || isChecked}
                                disabled={isLocked}
                                onChange={(e) => handlePermissionToggle(resource, action, role, e.target.checked)}
                                className="d-inline-block"
                              />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      ))}
    </>
  )
}

export default PagesSettingsTab
