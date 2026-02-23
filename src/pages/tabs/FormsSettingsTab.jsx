import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Table, Form, Button, Badge } from 'react-bootstrap'
import { FaPlus } from 'react-icons/fa'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { ENTITY_LABELS, FIELD_TYPE_OPTIONS } from '../../constants/defaultSettings'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const FORM_ENTITIES = ['patients', 'tests', 'medicines', 'users']

function FormsSettingsTab() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { settings, loading } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { error: showError } = useNotification()

  const handleToggle = async (entity, fieldName, property, value) => {
    const update = {
      forms: {
        [entity]: {
          fields: {
            [fieldName]: { [property]: value },
          },
        },
      },
    }
    if (property === 'visible' && !value) {
      update.forms[entity].fields[fieldName].required = false
    }
    try {
      await dispatch(updateSettings({ data: update, user })).unwrap()
    } catch (err) {
      showError('Failed to update setting: ' + (err || 'Unknown error'))
    }
  }

  const getTypeBadge = (type) => {
    const opt = FIELD_TYPE_OPTIONS.find(o => o.value === type)
    return opt ? opt.label : type
  }

  const getFirebaseType = (type) => {
    const opt = FIELD_TYPE_OPTIONS.find(o => o.value === type)
    return opt ? opt.firebaseType : 'string'
  }

  if (loading) {
    return <LoadingSpinner text="Loading settings..." />
  }

  return (
    <Row className="g-3">
      {FORM_ENTITIES.map((entity) => {
        const fields = settings?.forms?.[entity]?.fields
        if (!fields) return null

        return (
          <Col xs={12} key={entity}>
            <Card className="shadow-sm">
              <Card.Header className="card-header-theme d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fs-responsive-md">{ENTITY_LABELS[entity]} Form Fields</h5>
                <Button
                  size="sm"
                  className="btn-theme-add"
                  onClick={() => navigate(`/settings/forms/${entity}/new`)}
                >
                  <FaPlus className="me-1" /> Add Field
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0 table-mobile-responsive align-middle">
                    <thead className="bg-theme-slate">
                      <tr>
                        <th style={{ width: '18%' }}>Field Name</th>
                        <th style={{ width: '24%' }}>Display Name</th>
                        <th style={{ width: '18%' }}>Type</th>
                        <th style={{ width: '18%', textAlign: 'center' }}>Visible</th>
                        <th style={{ width: '18%', textAlign: 'center' }}>Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(fields).map(([fieldName, cfg]) => (
                        <tr key={fieldName} style={{ opacity: cfg.visible === false ? 0.5 : 1 }}>
                          <td data-label="Field Name">
                            <strong
                              onClick={() => navigate(`/settings/forms/${entity}/${fieldName}`)}
                              className="clickable-link text-theme"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                              {fieldName}
                            </strong>
                          </td>
                          <td data-label="Display Name">
                            <span style={{ fontSize: '0.9rem' }}>{cfg.label || fieldName}</span>
                          </td>
                          <td data-label="Type">
                            <Badge bg="light" text="dark" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                              {getTypeBadge(cfg.type)}
                            </Badge>
                            <br />
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {getFirebaseType(cfg.type)}
                            </small>
                          </td>
                          <td data-label="Visible" style={{ textAlign: 'center' }}>
                            <Form.Check
                              type="switch"
                              checked={cfg.visible !== false}
                              onChange={(e) => handleToggle(entity, fieldName, 'visible', e.target.checked)}
                              className="d-inline-block"
                            />
                          </td>
                          <td data-label="Required" style={{ textAlign: 'center' }}>
                            <Form.Check
                              type="switch"
                              checked={cfg.required === true}
                              onChange={(e) => handleToggle(entity, fieldName, 'required', e.target.checked)}
                              disabled={cfg.visible === false}
                              className="d-inline-block"
                            />
                          </td>
                        </tr>
                      ))}
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

export default FormsSettingsTab
