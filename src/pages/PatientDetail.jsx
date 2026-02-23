import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Badge, Collapse, Form } from 'react-bootstrap'
import { FaArrowLeft, FaUserInjured, FaMale, FaFemale, FaUser, FaWeight, FaRulerVertical, FaChevronDown, FaChevronRight } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { selectAllPatients, addPatient, updatePatient, deletePatient, fetchPatients } from '../store/patientsSlice'
import { selectAllCheckups } from '../store/checkupsSlice'
import { selectAllTests } from '../store/testsSlice'
import { useForm, useSettings } from '../hooks'
import { useNotification } from '../context'
import { EntityForm } from '../components/crud'
import { PermissionGate, usePermission } from '../components/auth/PermissionGate'

// Custom Gender Icon Selector Component
const GenderIconSelector = ({ value, onChange, name, disabled, label = 'Gender', required = true }) => {
  const genderOptions = [
    { value: 'Male', icon: FaMale, color: '#0891B2' },
    { value: 'Female', icon: FaFemale, color: '#06B6D4' },
    { value: 'Other', icon: FaUser, color: '#0aa2c0' }
  ]

  return (
    <Form.Group className="mb-3">
      <Form.Label>
        {label} {required && <span className="text-danger ms-1">*</span>}
      </Form.Label>
      <div className="d-flex gap-3">
        {genderOptions.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          return (
            <Icon
              key={option.value}
              size={28}
              onClick={() => !disabled && onChange({ target: { name, value: option.value } })}
              style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : isSelected ? 1 : 0.4,
                transition: 'opacity 0.2s',
                color: isSelected ? option.color : '#9ca3af'
              }}
            />
          )
        })}
      </div>
    </Form.Group>
  )
}

function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const patients = useSelector(selectAllPatients)
  const checkups = useSelector(selectAllCheckups)
  const tests = useSelector(selectAllTests)
  const { loading } = useSelector(state => state.patients)
  const { success, error: showError } = useNotification()
  const { checkPermission } = usePermission()
  const { getEntityFields, getInitialFormData, isFieldVisible, isFieldRequired, getFieldLabel } = useSettings()

  const isNew = id === 'new'
  const patient = isNew ? null : patients.find(p => p.id === id)

  // Get fields from settings, excluding gender (rendered as custom component)
  const visibleFields = getEntityFields('patients').filter(f => f.name !== 'gender')

  const INITIAL_FORM = useMemo(() =>
    getInitialFormData('patients', { gender: 'Male' }),
    [getInitialFormData]
  )

  const [patientCheckups, setPatientCheckups] = useState([])
  const [chartData, setChartData] = useState([])
  const [expandedRows, setExpandedRows] = useState({})

  const handleFormSubmit = useCallback(async (formData) => {
    const dataToSubmit = {
      ...formData,
      age: parseInt(formData.age),
    }

    try {
      if (isNew) {
        const result = await dispatch(addPatient(dataToSubmit))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to add patient')
        }
        success('Patient added successfully!')
        navigate(`/patients/${result.payload.id}`, { replace: true })
      } else {
        const result = await dispatch(updatePatient({ id, ...dataToSubmit }))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to update patient')
        }
        success('Patient updated successfully!')
      }
    } catch (err) {
      showError(err.message || 'Operation failed')
      throw err
    }
  }, [isNew, id, dispatch, navigate, success, showError])

  const form = useForm(INITIAL_FORM, handleFormSubmit)

  // Load patient data into form when editing
  useEffect(() => {
    if (patient) {
      const resetData = { ...INITIAL_FORM }
      Object.keys(resetData).forEach(key => {
        if (patient[key] != null) resetData[key] = String(patient[key])
      })
      // Restore gender properly
      if (patient.gender) resetData.gender = patient.gender
      form.resetTo(resetData)
    }
  }, [patient?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch patients if store is empty
  useEffect(() => {
    if (patients.length === 0) {
      dispatch(fetchPatients())
    }
  }, [dispatch, patients.length])

  // Build checkup history data
  useEffect(() => {
    if (isNew || !id) return

    const checkupsForPatient = checkups
      .filter(c => c.patientId === id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    setPatientCheckups(checkupsForPatient)

    const data = checkupsForPatient
      .filter(c => c.weight || c.height)
      .reverse()
      .map(c => ({
        date: new Date(c.timestamp).toLocaleDateString(),
        weight: c.weight ? parseFloat(c.weight) : null,
        height: c.height ? parseFloat(c.height) : null,
        timestamp: c.timestamp
      }))

    setChartData(data)
  }, [id, isNew, checkups])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return
    try {
      const result = await dispatch(deletePatient(id))
      if (result.type.includes('rejected')) {
        throw new Error(result.payload || 'Failed to delete patient')
      }
      success('Patient deleted successfully!')
      navigate('/patients')
    } catch (err) {
      showError(err.message || 'Delete failed')
    }
  }

  const toggleRow = (checkupId) => {
    setExpandedRows(prev => ({
      ...prev,
      [checkupId]: !prev[checkupId]
    }))
  }

  // Not found (only for edit mode, not new)
  if (!isNew && !patient && patients.length > 0) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Patient not found</h4>
            <Button
              onClick={() => navigate('/patients')}
              className="btn-theme"
            >
              <FaArrowLeft className="me-2" />
              Back to Patients
            </Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const canEdit = checkPermission('patients', isNew ? 'create' : 'edit')
  const canDelete = !isNew && checkPermission('patients', 'delete')

  return (
    <Container fluid className="p-3 p-md-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="fs-responsive-lg">
            <FaUserInjured className="me-2 text-theme" />
            {isNew ? 'Add New Patient' : 'Patient Details'}
          </h2>
        </Col>
      </Row>

      {/* Patient Form */}
      <Row className="mb-4">
        <Col>
          <EntityForm
            title={isNew ? 'New Patient Information' : 'Personal Information'}
            fields={visibleFields}
            formData={form.formData}
            formErrors={form.errors}
            onFormChange={form.handleChange}
            onSubmit={form.handleSubmit}
            onCancel={() => navigate('/patients')}
            onDelete={canDelete ? handleDelete : undefined}
            loading={form.isSubmitting || loading}
            isEditing={!isNew}
          >
            <Row className="g-3">
              {visibleFields.slice(0, 2).map((field) => (
                <Col key={field.name} xs={12} md={field.colSize || 6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      {field.label}
                      {field.required && <span className="text-danger ms-1">*</span>}
                    </Form.Label>
                    <Form.Control
                      type={field.type}
                      name={field.name}
                      value={form.formData[field.name] || ''}
                      onChange={form.handleChange}
                      required={field.required}
                      disabled={form.isSubmitting || !canEdit}
                    />
                  </Form.Group>
                </Col>
              ))}
              {isFieldVisible('patients', 'gender') && (
                <Col xs={12}>
                  <GenderIconSelector
                    value={form.formData.gender}
                    onChange={form.handleChange}
                    name="gender"
                    disabled={form.isSubmitting || !canEdit}
                    label={getFieldLabel('patients', 'gender', 'Gender')}
                    required={isFieldRequired('patients', 'gender', true)}
                  />
                </Col>
              )}
              {visibleFields.slice(2).map((field) => (
                <Col key={field.name} xs={12} md={field.colSize || 6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      {field.label}
                      {field.required && <span className="text-danger ms-1">*</span>}
                    </Form.Label>
                    {field.type === 'textarea' ? (
                      <Form.Control
                        as="textarea"
                        rows={field.rows || 3}
                        name={field.name}
                        value={form.formData[field.name] || ''}
                        onChange={form.handleChange}
                        required={field.required}
                        disabled={form.isSubmitting || !canEdit}
                      />
                    ) : (
                      <Form.Control
                        type={field.type}
                        name={field.name}
                        value={form.formData[field.name] || ''}
                        onChange={form.handleChange}
                        required={field.required}
                        disabled={form.isSubmitting || !canEdit}
                      />
                    )}
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </EntityForm>
        </Col>
      </Row>

      {/* Checkup history and charts only shown in edit mode */}
      {!isNew && patient && (
        <>
          {/* Patient Stats and Graph Section */}
          <Row className="mb-4">
            {/* Stats */}
            <Col xs={12} lg={4} className="mb-3 mb-lg-0">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-theme-light text-white">
                  <h5 className="mb-0">Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <strong>Total Checkups:</strong>{' '}
                    <Badge className="badge-theme-light">
                      {patientCheckups.length}
                    </Badge>
                  </div>

                  {chartData.length > 0 && (
                    <>
                      <div className="mb-2">
                        <FaWeight className="me-2 text-theme" />
                        <strong>Latest Weight:</strong> {chartData[chartData.length - 1].weight || 'N/A'} kg
                      </div>
                      <div className="mb-2">
                        <FaRulerVertical className="me-2 text-theme-light" />
                        <strong>Latest Height:</strong> {chartData[chartData.length - 1].height || 'N/A'} cm
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Height/Weight Graph */}
            <Col xs={12} lg={8}>
              <Card className="shadow-sm">
                <Card.Header className="bg-theme-light text-white">
                  <h5 className="mb-0">Height & Weight Tracking</h5>
                </Card.Header>
                <Card.Body>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Height (cm)', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="weight"
                          stroke="#0891B2"
                          strokeWidth={2}
                          dot={{ fill: '#0891B2', r: 4 }}
                          name="Weight (kg)"
                          connectNulls
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="height"
                          stroke="#06B6D4"
                          strokeWidth={2}
                          dot={{ fill: '#06B6D4', r: 4 }}
                          name="Height (cm)"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <FaWeight size={48} className="mb-3" style={{ color: '#cbd5e1' }} />
                      <p>No height/weight data recorded yet</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Checkup History Section */}
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Header className="bg-theme-light text-white">
                  <h5 className="mb-0">Checkup History</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  {patientCheckups.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      No checkups recorded yet
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0 table-mobile-responsive">
                        <thead className="bg-theme-slate">
                          <tr>
                            <th style={{ width: '5%' }}></th>
                            <th style={{ width: '20%' }}>Date</th>
                            <th style={{ width: '15%' }}>Tests Count</th>
                            <th style={{ width: '60%' }}>General Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientCheckups.map((checkup) => {
                            const isExpanded = expandedRows[checkup.id]
                            return (
                              <React.Fragment key={checkup.id}>
                                <tr
                                  onClick={() => toggleRow(checkup.id)}
                                  style={{
                                    cursor: 'pointer',
                                    backgroundColor: isExpanded ? '#f0f9ff' : 'transparent'
                                  }}
                                >
                                  <td data-label="" className="text-center">
                                    {isExpanded ? (
                                      <FaChevronDown className="text-theme" />
                                    ) : (
                                      <FaChevronRight className="text-theme-muted-light" />
                                    )}
                                  </td>
                                  <td data-label="Date">
                                    <strong className="text-theme">
                                      {new Date(checkup.timestamp).toLocaleDateString()}
                                    </strong>
                                    <br />
                                    <small className="text-muted">
                                      {new Date(checkup.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </small>
                                  </td>
                                  <td data-label="Tests">
                                    <Badge
                                      className="badge-theme"
                                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                    >
                                      {checkup.tests.length} test{checkup.tests.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </td>
                                  <td data-label="Notes">
                                    {checkup.notes ? (
                                      <div style={{ fontSize: '0.9rem' }}>{checkup.notes}</div>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                </tr>

                                <tr>
                                  <td colSpan="4" style={{ padding: 0, border: 'none' }}>
                                    <Collapse in={isExpanded}>
                                      <div>
                                        <div className="bg-theme-slate" style={{ padding: '0.5rem 1rem' }}>
                                          <Table
                                            size="sm"
                                            className="mb-0 table-mobile-responsive"
                                            style={{ backgroundColor: 'white' }}
                                          >
                                            <thead className="bg-light-cyan">
                                              <tr>
                                                <th style={{ width: '40%' }}>Test Name</th>
                                                <th style={{ width: '60%' }}>Notes</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {checkup.tests.map((testItem) => {
                                                const test = tests.find(t => t.id === testItem.testId)

                                                return test ? (
                                                  <tr key={testItem.testId}>
                                                    <td data-label="Test Name">
                                                      <strong className="text-theme">
                                                        {test.name}
                                                      </strong>
                                                    </td>
                                                    <td data-label="Notes">
                                                      {testItem.notes ? (
                                                        <div style={{ fontSize: '0.85rem' }}>{testItem.notes}</div>
                                                      ) : (
                                                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                          No specific notes for this test
                                                        </span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ) : null
                                              })}
                                            </tbody>
                                          </Table>
                                        </div>
                                      </div>
                                    </Collapse>
                                  </td>
                                </tr>
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}

export default PatientDetail
