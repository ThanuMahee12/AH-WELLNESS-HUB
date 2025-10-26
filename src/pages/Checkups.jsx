import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaClipboardCheck } from 'react-icons/fa'
import Select from 'react-select'
import { fetchCheckups, addCheckup, updateCheckup, deleteCheckup, selectAllCheckups } from '../store/checkupsSlice'
import { fetchPatients, addPatient, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import { PermissionGate, usePermission } from '../components/auth/PermissionGate'

function Checkups() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const checkups = useSelector(selectAllCheckups)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)
  const { loading: checkupsLoading, error: checkupsError } = useSelector(state => state.checkups)
  const { loading: patientsLoading } = useSelector(state => state.patients)
  const { loading: testsLoading } = useSelector(state => state.tests)
  const { checkPermission } = usePermission()
  const [showModal, setShowModal] = useState(false)
  const [editingCheckup, setEditingCheckup] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    tests: [],
    weight: '',
    height: ''
  })
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mobile: '',
    email: '',
    address: ''
  })

  const loading = checkupsLoading || patientsLoading || testsLoading

  useEffect(() => {
    dispatch(fetchCheckups())
    dispatch(fetchPatients())
    dispatch(fetchTests())
  }, [dispatch])

  const handleClose = () => {
    setShowModal(false)
    setEditingCheckup(null)
    setCurrentStep(1)
    setShowNewPatientForm(false)
    setFormData({ patientId: '', tests: [], weight: '', height: '' })
    setNewPatientData({ name: '', age: '', gender: 'Male', mobile: '', email: '', address: '' })
  }

  const handleShow = (checkup = null) => {
    if (checkup) {
      setEditingCheckup(checkup)
      setCurrentStep(2) // Skip to step 2 when editing
      setFormData({
        patientId: checkup.patientId,
        tests: checkup.tests,
        weight: checkup.weight || '',
        height: checkup.height || ''
      })
    }
    setShowModal(true)
  }

  const handlePatientSelect = (selectedOption) => {
    if (selectedOption) {
      setFormData(prev => ({ ...prev, patientId: selectedOption.value }))
      setShowNewPatientForm(false)
    }
  }

  const handleCreateNewPatient = async () => {
    try {
      const result = await dispatch(addPatient(newPatientData))
      if (result.payload?.id) {
        setFormData(prev => ({ ...prev, patientId: result.payload.id }))
        setShowNewPatientForm(false)
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Error creating patient:', error)
    }
  }

  const handleNextStep = () => {
    if (currentStep === 1 && formData.patientId) {
      setCurrentStep(2)
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(1)
  }

  const handleTestChange = (selectedOptions) => {
    const newTests = selectedOptions ? selectedOptions.map(option => ({
      testId: option.value
    })) : []

    setFormData(prev => ({
      ...prev,
      tests: newTests
    }))
  }

  const calculateTotal = () => {
    return formData.tests.reduce((sum, testItem) => {
      const test = tests.find(t => t.id === testItem.testId)
      return sum + (test?.price || 0)
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.tests.length === 0) {
      alert('Please select at least one test')
      return
    }

    const checkupData = {
      ...formData,
      patientId: formData.patientId,
      total: calculateTotal()
    }

    if (editingCheckup) {
      await dispatch(updateCheckup({ id: editingCheckup.id, ...checkupData, timestamp: editingCheckup.timestamp }))
    } else {
      await dispatch(addCheckup(checkupData))
    }
    handleClose()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this checkup?')) {
      await dispatch(deleteCheckup(id))
    }
  }

  if (loading && checkups.length === 0) {
    return <LoadingSpinner text="Loading checkups data..." />
  }

  const handleViewDetails = (checkupId) => {
    navigate(`/checkups/${checkupId}`)
  }

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId)
    return patient ? patient.name : 'Unknown'
  }

  const getTestNames = (testItems) => {
    return testItems
      .map(testItem => {
        const test = tests.find(t => t.id === testItem.testId)
        return test ? test.name : null
      })
      .filter(Boolean)
      .join(', ')
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h2><FaClipboardCheck className="me-2 text-secondary" />Checkups / Billing</h2>
            <PermissionGate resource="checkups" action="create">
              <Button
                onClick={() => handleShow()}
                className="mt-2 mt-md-0"
                disabled={patients.length === 0 || loading}
                style={{
                  backgroundColor: '#06B6D4',
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontWeight: '500'
                }}
              >
                <FaPlus className="me-2" />New Checkup
              </Button>
            </PermissionGate>
          </div>
        </Col>
      </Row>

      {checkupsError && (
        <Row className="mb-3">
          <Col>
            <ErrorAlert error={checkupsError} />
          </Col>
        </Row>
      )}

      {patients.length === 0 && !patientsLoading && (
        <Row className="mb-3">
          <Col>
            <Card className="border-warning">
              <Card.Body className="text-warning">
                Please add patients first before creating checkups
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table striped hover className="mb-0 table-mobile-responsive">
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Patient</th>
                      <th>Tests</th>
                      <th>Total (Rs.)</th>
                      <th>Date/Time</th>
                      {(checkPermission('checkups', 'edit') || checkPermission('checkups', 'delete')) && (
                        <th className="text-center">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {checkups.length === 0 ? (
                      <tr>
                        <td colSpan={(checkPermission('checkups', 'edit') || checkPermission('checkups', 'delete')) ? "6" : "5"} className="text-center py-4 text-muted">
                          No checkups recorded yet
                        </td>
                      </tr>
                    ) : (
                      checkups.map(checkup => (
                        <tr key={checkup.id}>
                          <td data-label="Bill No">
                            <Badge
                              onClick={() => handleViewDetails(checkup.id)}
                              style={{
                                backgroundColor: '#06B6D4',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#0891B2'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#06B6D4'}
                            >
                              {checkup.billNo || `#${checkup.id}`}
                            </Badge>
                          </td>
                          <td data-label="Patient"><strong>{getPatientName(checkup.patientId)}</strong></td>
                          <td data-label="Tests">
                            <div
                              style={{
                                maxWidth: '300px',
                                maxHeight: '80px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                wordWrap: 'break-word',
                                fontSize: '0.875rem',
                                lineHeight: '1.4'
                              }}
                            >
                              {getTestNames(checkup.tests)}
                            </div>
                          </td>
                          <td data-label="Total"><strong>Rs. {checkup.total.toFixed(2)}</strong></td>
                          <td data-label="Date/Time">{new Date(checkup.timestamp).toLocaleString()}</td>
                          {(checkPermission('checkups', 'edit') || checkPermission('checkups', 'delete')) && (
                            <td data-label="Actions">
                              <div className="d-flex gap-2 justify-content-center flex-wrap">
                                <PermissionGate resource="checkups" action="edit">
                                  <Button
                                    size="sm"
                                    onClick={() => handleShow(checkup)}
                                    disabled={loading}
                                    style={{
                                      backgroundColor: '#0891B2',
                                      border: 'none',
                                      color: 'white'
                                    }}
                                  >
                                    <FaEdit />
                                  </Button>
                                </PermissionGate>
                                <PermissionGate resource="checkups" action="delete">
                                  <Button
                                    size="sm"
                                    onClick={() => handleDelete(checkup.id)}
                                    disabled={loading}
                                    style={{
                                      backgroundColor: '#ef4444',
                                      border: 'none',
                                      color: 'white'
                                    }}
                                  >
                                    <FaTrash />
                                  </Button>
                                </PermissionGate>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCheckup ? 'Edit Checkup' : 'New Checkup / Bill'}
            {!editingCheckup && <span className="ms-2 text-muted" style={{ fontSize: '14px' }}>Step {currentStep} of 2</span>}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Step 1: Patient Selection/Creation */}
            {currentStep === 1 && !editingCheckup && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Select Patient *</Form.Label>
                  <Select
                    options={patients.map(patient => ({
                      value: patient.id,
                      label: `${patient.name} - ${patient.age}yr - ${patient.mobile}`,
                      patient: patient
                    }))}
                    value={patients
                      .filter(p => p.id === formData.patientId)
                      .map(patient => ({
                        value: patient.id,
                        label: `${patient.name} - ${patient.age}yr - ${patient.mobile}`
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
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Name *</Form.Label>
                            <Form.Control
                              type="text"
                              value={newPatientData.name}
                              onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Age *</Form.Label>
                            <Form.Control
                              type="number"
                              value={newPatientData.age}
                              onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Gender *</Form.Label>
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
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Mobile *</Form.Label>
                            <Form.Control
                              type="tel"
                              value={newPatientData.mobile}
                              onChange={(e) => setNewPatientData({ ...newPatientData, mobile: e.target.value })}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={newPatientData.email}
                              onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Address *</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={newPatientData.address}
                              onChange={(e) => setNewPatientData({ ...newPatientData, address: e.target.value })}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Button variant="primary" onClick={handleCreateNewPatient} size="sm">
                        Create Patient & Continue
                      </Button>
                    </Card.Body>
                  </Card>
                )}
              </>
            )}

            {/* Step 2: Test Selection */}
            {(currentStep === 2 || editingCheckup) && (
              <>
                {currentStep === 2 && !editingCheckup && (
                  <div className="alert alert-info mb-3">
                    <strong>Patient:</strong> {patients.find(p => p.id === formData.patientId)?.name}
                    <Button
                      variant="link"
                      size="sm"
                      className="float-end"
                      onClick={handlePreviousStep}
                    >
                      Change Patient
                    </Button>
                  </div>
                )}

                {editingCheckup && (
                  <Form.Group className="mb-3">
                    <Form.Label>Patient</Form.Label>
                    <Form.Control
                      type="text"
                      value={patients.find(p => p.id === formData.patientId)?.name || 'Unknown'}
                      disabled
                    />
                  </Form.Group>
                )}

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
                    // In tags - show code and name
                    return (
                      <span>
                        <strong style={{ color: '#0891B2' }}>{option.code}</strong> - {option.label}
                      </span>
                    )
                  }
                  // In dropdown - show code, name, details and price
                  return (
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div style={{ fontSize: '14px' }}>
                          <strong style={{ color: '#0891B2' }}>{option.code}</strong> - <strong>{option.label}</strong>
                        </div>
                        {option.details && <small className="text-muted" style={{ fontSize: '12px' }}>{option.details}</small>}
                      </div>
                      <Badge style={{ backgroundColor: '#0891B2', color: 'white', fontSize: '11px' }}>Rs. {option.price?.toFixed(2)}</Badge>
                    </div>
                  )
                }}
                styles={{
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
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Total Amount: <Badge style={{ backgroundColor: '#06B6D4', color: 'white' }} className="fs-6">Rs. {calculateTotal().toFixed(2)}</Badge>
              </Form.Label>
            </Form.Group>

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

                <div style={{ padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '0.375rem', marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#0369a1', marginBottom: 0 }}>
                    <strong>Note:</strong> You can add detailed notes and prescriptions after creating the checkup by clicking on "View Details" and using the Notes & Prescription tabs.
                  </p>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>

            {currentStep === 1 && !editingCheckup && (
              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={!formData.patientId}
              >
                Next: Select Tests
              </Button>
            )}

            {(currentStep === 2 || editingCheckup) && (
              <>
                {currentStep === 2 && !editingCheckup && (
                  <Button variant="outline-secondary" onClick={handlePreviousStep}>
                    Back
                  </Button>
                )}
                <Button variant="primary" type="submit">
                  {editingCheckup ? 'Update' : 'Create'} Checkup
                </Button>
              </>
            )}
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Checkups
