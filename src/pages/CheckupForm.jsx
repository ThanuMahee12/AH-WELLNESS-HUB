import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap'
import { FaClipboardCheck, FaArrowLeft, FaSave, FaTrash, FaPlus } from 'react-icons/fa'
import Select from 'react-select'
import { fetchCheckups, addCheckup, updateCheckup, deleteCheckup, selectAllCheckups } from '../store/checkupsSlice'
import { fetchPatients, addPatient, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { useNotification } from '../context'
import { usePermission } from '../components/auth/PermissionGate'
import { useSettings } from '../hooks'
import LoadingSpinner from '../components/common/LoadingSpinner'

function CheckupForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { success, error: showError } = useNotification()
  const { checkPermission } = usePermission()
  const { isFieldVisible, isFieldRequired, getFieldLabel } = useSettings()

  const checkups = useSelector(selectAllCheckups)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)
  const { loading: checkupsLoading } = useSelector(state => state.checkups)
  const { loading: patientsLoading } = useSelector(state => state.patients)
  const { loading: testsLoading } = useSelector(state => state.tests)

  const isNew = !id
  const checkup = isNew ? null : checkups.find(c => c.id === id)
  const loading = checkupsLoading || patientsLoading || testsLoading

  const [formData, setFormData] = useState({
    patientId: '',
    tests: [],
    weight: '',
    height: ''
  })
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mobile: '',
    email: '',
    address: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch data if store is empty
  useEffect(() => {
    if (checkups.length === 0) dispatch(fetchCheckups())
    if (patients.length === 0) dispatch(fetchPatients())
    if (tests.length === 0) dispatch(fetchTests())
  }, [dispatch, checkups.length, patients.length, tests.length])

  // Load checkup data into form when editing
  useEffect(() => {
    if (checkup) {
      setFormData({
        patientId: checkup.patientId || '',
        tests: checkup.tests || [],
        weight: checkup.weight || '',
        height: checkup.height || ''
      })
    }
  }, [checkup?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePatientSelect = (selectedOption) => {
    if (selectedOption) {
      setFormData(prev => ({ ...prev, patientId: selectedOption.value }))
      setShowNewPatientForm(false)
    } else {
      setFormData(prev => ({ ...prev, patientId: '' }))
    }
  }

  const handleCreateNewPatient = async () => {
    try {
      const result = await dispatch(addPatient(newPatientData))
      if (result.payload?.id) {
        setFormData(prev => ({ ...prev, patientId: result.payload.id }))
        setShowNewPatientForm(false)
        setNewPatientData({ name: '', age: '', gender: 'Male', mobile: '', email: '', address: '' })
        success('Patient created successfully!')
      }
    } catch (err) {
      showError(err.message || 'Error creating patient')
    }
  }

  const handleTestChange = (selectedOptions) => {
    const newTests = selectedOptions ? selectedOptions.map(option => ({
      testId: option.value
    })) : []
    setFormData(prev => ({ ...prev, tests: newTests }))
  }

  const calculateTotal = useCallback(() => {
    return formData.tests.reduce((sum, testItem) => {
      const test = tests.find(t => t.id === testItem.testId)
      return sum + (test?.price || 0)
    }, 0)
  }, [formData.tests, tests])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.patientId) {
      showError('Please select a patient')
      return
    }

    if (formData.tests.length === 0) {
      showError('Please select at least one test')
      return
    }

    setIsSubmitting(true)

    const checkupData = {
      ...formData,
      total: calculateTotal()
    }

    try {
      if (isNew) {
        const result = await dispatch(addCheckup(checkupData))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to create checkup')
        }
        success('Checkup created successfully!')
        navigate(`/checkups/${result.payload.id}`, { replace: true })
      } else {
        const result = await dispatch(updateCheckup({
          id,
          ...checkupData,
          timestamp: checkup.timestamp
        }))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to update checkup')
        }
        success('Checkup updated successfully!')
        navigate(`/checkups/${id}`)
      }
    } catch (err) {
      showError(err.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this checkup?')) return
    try {
      const result = await dispatch(deleteCheckup(id))
      if (result.type.includes('rejected')) {
        throw new Error(result.payload || 'Failed to delete checkup')
      }
      success('Checkup deleted successfully!')
      navigate('/checkups')
    } catch (err) {
      showError(err.message || 'Delete failed')
    }
  }

  // Loading state
  if (loading && checkups.length === 0) {
    return <LoadingSpinner text="Loading data..." />
  }

  // Not found
  if (!isNew && !checkup && checkups.length > 0) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Checkup not found</h4>
            <Button
              onClick={() => navigate('/checkups')}
              className="btn-theme"
            >
              <FaArrowLeft className="me-2" />
              Back to Checkups
            </Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const patient = patients.find(p => p.id === formData.patientId)
  const canDelete = !isNew && checkPermission('checkups', 'delete')

  // react-select styles for test multi-select
  const testSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '38px',
      fontSize: '14px'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 8px',
      gap: '3px'
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#0dcaf0',
      borderRadius: '3px',
      margin: '2px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'white',
      fontSize: '13px',
      padding: '2px 8px'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'white',
      padding: '2px 4px',
      ':hover': {
        backgroundColor: '#0aa2c0',
        color: 'white'
      }
    }),
    option: (base) => ({
      ...base,
      padding: '8px 12px'
    }),
    menu: (base) => ({
      ...base,
      fontSize: '14px'
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '14px'
    })
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fs-responsive-lg">
            <FaClipboardCheck className="me-2 text-theme" />
            {isNew ? 'New Checkup / Bill' : 'Edit Checkup'}
          </h2>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="card-header-theme">
              <h5 className="mb-0 fs-responsive-md">
                {isNew ? 'Checkup Information' : `Edit Checkup: ${checkup?.billNo || checkup?.id || ''}`}
              </h5>
            </Card.Header>

            <Form onSubmit={handleSubmit}>
              <Card.Body className="entity-form-body">
                {/* Patient Selection Section */}
                <h6 className="section-heading">
                  Patient
                </h6>

                <Form.Group className="mb-3">
                  <Form.Label>Select Patient *</Form.Label>
                  <Select
                    options={patients.map(p => ({
                      value: p.id,
                      label: `${p.name} - ${p.age}yr - ${p.mobile}`,
                      patient: p
                    }))}
                    value={patients
                      .filter(p => p.id === formData.patientId)
                      .map(p => ({
                        value: p.id,
                        label: `${p.name} - ${p.age}yr - ${p.mobile}`
                      }))[0] || null}
                    onChange={handlePatientSelect}
                    placeholder="Search patient by name, mobile..."
                    isClearable
                    formatOptionLabel={(option) => (
                      <div>
                        <div><strong>{option.patient?.name || option.label.split(' - ')[0]}</strong></div>
                        <small className="text-muted">
                          {option.patient?.age}yr, {option.patient?.gender} - {option.patient?.mobile}
                        </small>
                      </div>
                    )}
                  />
                </Form.Group>

                <div className="text-center mb-3">
                  <Button
                    variant="link"
                    onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                  >
                    {showNewPatientForm ? 'Cancel' : '+ Add New Patient'}
                  </Button>
                </div>

                {showNewPatientForm && (
                  <Card className="mb-3">
                    <Card.Header className="bg-light">
                      <strong>New Patient Information</strong>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        {isFieldVisible('patients', 'name') && (
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                {getFieldLabel('patients', 'name', 'Name')}
                                {isFieldRequired('patients', 'name', true) && <span className="text-danger ms-1">*</span>}
                              </Form.Label>
                              <Form.Control
                                type="text"
                                value={newPatientData.name}
                                onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                                required={isFieldRequired('patients', 'name', true)}
                              />
                            </Form.Group>
                          </Col>
                        )}
                        {isFieldVisible('patients', 'age') && (
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                {getFieldLabel('patients', 'age', 'Age')}
                                {isFieldRequired('patients', 'age', true) && <span className="text-danger ms-1">*</span>}
                              </Form.Label>
                              <Form.Control
                                type="number"
                                value={newPatientData.age}
                                onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                                required={isFieldRequired('patients', 'age', true)}
                              />
                            </Form.Group>
                          </Col>
                        )}
                        {isFieldVisible('patients', 'gender') && (
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                {getFieldLabel('patients', 'gender', 'Gender')}
                                {isFieldRequired('patients', 'gender', true) && <span className="text-danger ms-1">*</span>}
                              </Form.Label>
                              <Form.Select
                                value={newPatientData.gender}
                                onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                              >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        )}
                        {isFieldVisible('patients', 'mobile') && (
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                {getFieldLabel('patients', 'mobile', 'Mobile')}
                                {isFieldRequired('patients', 'mobile', true) && <span className="text-danger ms-1">*</span>}
                              </Form.Label>
                              <Form.Control
                                type="tel"
                                value={newPatientData.mobile}
                                onChange={(e) => setNewPatientData({ ...newPatientData, mobile: e.target.value })}
                                required={isFieldRequired('patients', 'mobile', true)}
                              />
                            </Form.Group>
                          </Col>
                        )}
                        {isFieldVisible('patients', 'email') && (
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                {getFieldLabel('patients', 'email', 'Email')}
                                {isFieldRequired('patients', 'email', false) && <span className="text-danger ms-1">*</span>}
                              </Form.Label>
                              <Form.Control
                                type="email"
                                value={newPatientData.email}
                                onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                                required={isFieldRequired('patients', 'email', false)}
                              />
                            </Form.Group>
                          </Col>
                        )}
                        {isFieldVisible('patients', 'address') && (
                          <Col md={12}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                {getFieldLabel('patients', 'address', 'Address')}
                                {isFieldRequired('patients', 'address', true) && <span className="text-danger ms-1">*</span>}
                              </Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={newPatientData.address}
                                onChange={(e) => setNewPatientData({ ...newPatientData, address: e.target.value })}
                                required={isFieldRequired('patients', 'address', true)}
                              />
                            </Form.Group>
                          </Col>
                        )}
                      </Row>
                      <Button variant="primary" onClick={handleCreateNewPatient} size="sm">
                        <FaPlus className="me-1" />
                        Create Patient & Continue
                      </Button>
                    </Card.Body>
                  </Card>
                )}

                {/* Tests Selection Section */}
                <h6 className="section-heading mt-4">
                  Tests
                </h6>

                <Form.Group className="mb-3">
                  <Form.Label>Select Tests *</Form.Label>
                  <Select
                    isMulti
                    options={tests.map(test => ({
                      value: test.id,
                      label: test.name,
                      code: test.code,
                      price: test.price,
                      details: test.details
                    }))}
                    value={tests
                      .filter(test => formData.tests.some(t => t.testId === test.id))
                      .map(test => ({
                        value: test.id,
                        label: test.name,
                        code: test.code
                      }))}
                    onChange={handleTestChange}
                    isDisabled={loading}
                    placeholder="Search tests by name or code..."
                    formatOptionLabel={(option, { context }) => {
                      if (context === 'value') {
                        return (
                          <span>
                            <strong className="text-theme">{option.code}</strong> - {option.label}
                          </span>
                        )
                      }
                      return (
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div style={{ fontSize: '14px' }}>
                              <strong className="text-theme">{option.code}</strong> - <strong>{option.label}</strong>
                            </div>
                            {option.details && <small className="text-muted" style={{ fontSize: '12px' }}>{option.details}</small>}
                          </div>
                          <Badge className="badge-theme" style={{ fontSize: '11px' }}>Rs. {option.price?.toFixed(2)}</Badge>
                        </div>
                      )
                    }}
                    styles={testSelectStyles}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Total Amount: <Badge className="badge-theme-light fs-6">Rs. {calculateTotal().toFixed(2)}</Badge>
                  </Form.Label>
                </Form.Group>

                {/* Weight/Height Section */}
                <h6 className="section-heading mt-4">
                  Measurements (Optional)
                </h6>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Weight (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="Enter weight in kg (optional)"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Height (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="Enter height in cm (optional)"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="info-box mt-3">
                  <p style={{ fontSize: '0.9rem', color: '#0369a1', marginBottom: 0 }}>
                    <strong>Note:</strong> You can add detailed notes and prescriptions after creating the checkup by clicking on "View Details" and using the Notes & Prescription tabs.
                  </p>
                </div>
              </Card.Body>

              <Card.Footer className="entity-form-footer">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate(isNew ? '/checkups' : `/checkups/${id}`)}
                  disabled={isSubmitting}
                  className="entity-form-btn"
                >
                  <FaArrowLeft className="me-1" />
                  {isNew ? 'Back' : 'Cancel'}
                </Button>

                <div className="entity-form-actions">
                  {canDelete && (
                    <Button
                      variant="outline-danger"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="entity-form-btn"
                    >
                      <FaTrash className="me-1" />
                      Delete
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="entity-form-btn btn-theme"
                  >
                    <FaSave className="me-1" />
                    {isSubmitting ? 'Saving...' : (isNew ? 'Create Checkup' : 'Update Checkup')}
                  </Button>
                </div>

              </Card.Footer>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default CheckupForm
