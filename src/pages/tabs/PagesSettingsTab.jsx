import { useSelector, useDispatch } from 'react-redux'
import { Card, Table, Form } from 'react-bootstrap'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { ALL_ROLES, PERMISSION_ACTIONS, PERMISSION_RESOURCES, ENTITY_LABELS } from '../../constants/defaultSettings'
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
          <h5 className="mb-0 fs-responsive-md">Page Access by Role</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 table-mobile-responsive align-middle">
              <thead className="bg-theme-slate">
                <tr>
                  <th style={{ width: '30%' }}>Page</th>
                  {ALL_ROLES.map(role => (
                    <th key={role} style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(pages).map(([pageKey, cfg]) => (
                  <tr key={pageKey}>
                    <td data-label="Page">
                      <strong>{cfg.label || pageKey}</strong>
                    </td>
                    {ALL_ROLES.map(role => {
                      const isChecked = cfg.roles?.includes(role) ?? false
                      // Superadmin + Settings row is always locked on
                      const isLocked = pageKey === 'settings' && role === 'superadmin'

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
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

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
