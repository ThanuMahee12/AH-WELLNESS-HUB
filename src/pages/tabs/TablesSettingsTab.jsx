import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Table, Form, Button } from 'react-bootstrap'
import { FaPlus } from 'react-icons/fa'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { ENTITY_LABELS, ALL_ROLES } from '../../constants/defaultSettings'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const TABLE_ENTITIES = ['patients', 'tests', 'medicines', 'users', 'checkups']
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, 20, 25, 50]

function TablesSettingsTab() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { settings, loading } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { error: showError } = useNotification()

  const handleItemsPerPage = async (entity, value) => {
    try {
      await dispatch(updateSettings({
        data: {
          tables: {
            [entity]: { itemsPerPage: Number(value) },
          },
        },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update setting: ' + (err || 'Unknown error'))
    }
  }

  const handleToggle = async (entity, columnKey, field, value) => {
    try {
      await dispatch(updateSettings({
        data: {
          tables: {
            [entity]: {
              columns: {
                [columnKey]: { [field]: value },
              },
            },
          },
        },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update setting: ' + (err || 'Unknown error'))
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading settings..." />
  }

  return (
    <Row className="g-3">
      {TABLE_ENTITIES.map((entity) => {
        const tableSettings = settings?.tables?.[entity]
        const columns = tableSettings?.columns
        if (!columns) return null
        const currentItemsPerPage = tableSettings?.itemsPerPage || 10

        return (
          <Col xs={12} key={entity}>
            <Card className="shadow-sm">
              <Card.Header className="card-header-theme d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <h5 className="mb-0 fs-responsive-md">{ENTITY_LABELS[entity]} Table</h5>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Label className="mb-0 text-white" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      Rows per page:
                    </Form.Label>
                    <Form.Select
                      size="sm"
                      value={currentItemsPerPage}
                      onChange={(e) => handleItemsPerPage(entity, e.target.value)}
                      style={{ width: '75px' }}
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="btn-theme-add"
                  onClick={() => navigate(`/settings/tables/${entity}/new`)}
                >
                  <FaPlus className="me-1" /> Add Column
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0 table-mobile-responsive align-middle">
                    <thead className="bg-theme-slate">
                      <tr>
                        <th>Column Key</th>
                        <th>Display Name</th>
                        <th>Roles</th>
                        <th style={{ textAlign: 'center' }}>Search</th>
                        <th style={{ textAlign: 'center' }}>Visible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(columns).map(([columnKey, cfg]) => {
                        const colRoles = cfg.roles || ALL_ROLES
                        return (
                          <tr key={columnKey} style={{ opacity: cfg.visible === false ? 0.5 : 1 }}>
                            <td data-label="Column Key">
                              <strong
                                onClick={() => navigate(`/settings/tables/${entity}/${columnKey}`)}
                                className="clickable-link text-theme"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                              >
                                {columnKey}
                              </strong>
                            </td>
                            <td data-label="Display Name">
                              <span style={{ fontSize: '0.9rem' }}>{cfg.label || columnKey}</span>
                            </td>
                            <td data-label="Roles">
                              <div className="d-flex flex-wrap gap-1">
                                {colRoles.map(r => (
                                  <span key={r} className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>{r}</span>
                                ))}
                              </div>
                            </td>
                            <td data-label="Search" style={{ textAlign: 'center' }}>
                              <Form.Check
                                type="switch"
                                checked={cfg.searchable !== false}
                                onChange={(e) => handleToggle(entity, columnKey, 'searchable', e.target.checked)}
                                className="d-inline-block"
                              />
                            </td>
                            <td data-label="Visible" style={{ textAlign: 'center' }}>
                              <Form.Check
                                type="switch"
                                checked={cfg.visible !== false}
                                onChange={(e) => handleToggle(entity, columnKey, 'visible', e.target.checked)}
                                className="d-inline-block"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )
      })}
    </Row>
  )
}

export default TablesSettingsTab
