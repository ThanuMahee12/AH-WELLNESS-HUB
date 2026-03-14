import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap'
import { FaClipboardCheck, FaSave, FaTrash, FaPlus, FaTimes, FaStickyNote, FaPrescriptionBottleAlt, FaVial, FaFileInvoice, FaStethoscope } from 'react-icons/fa'
import { Breadcrumb, RichTextEditor } from '../components/ui'
import Select from 'react-select'
import { fetchCheckups, addCheckup, updateCheckup, deleteCheckup, selectAllCheckups } from '../store/checkupsSlice'
import { fetchPatients, addPatient, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { selectAllMedicines, fetchMedicines } from '../store/medicinesSlice'
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
  const { settings, isFieldVisible, isFieldRequired, getFieldLabel, getLabResultFields, getGeneralTestFields } = useSettings()
  const labResultFields = getLabResultFields()
  const generalTestFields = getGeneralTestFields()

  const checkups = useSelector(selectAllCheckups)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)
  const medicines = useSelector(selectAllMedicines)
  const { loading: checkupsLoading } = useSelector(state => state.checkups)
  const { loading: patientsLoading } = useSelector(state => state.patients)
  const { loading: testsLoading } = useSelector(state => state.tests)

  const isNew = !id
  const checkup = isNew ? null : checkups.find(c => c.id === id)
  const loading = checkupsLoading || patientsLoading || testsLoading

  const [formData, setFormData] = useState({
    patientId: '',
    tests: [],
    ownTests: true,
    doctorFees: '',
    paid: true,
    validDays: '',
    useESign: true,
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

  // Additional fields (edit mode only)
  const [editedNotes, setEditedNotes] = useState('')
  const [editedCommonNotes, setEditedCommonNotes] = useState('')
  const [editedTestNotes, setEditedTestNotes] = useState({})
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [editedGeneralTests, setEditedGeneralTests] = useState({})
  const [editedLabResults, setEditedLabResults] = useState({})
  const [selectedTestForNote, setSelectedTestForNote] = useState(null)

  // Set default validDays from settings for new checkups
  useEffect(() => {
    if (isNew && settings?.checkupPdf?.defaultValidDays && !formData.validDays) {
      setFormData(prev => ({ ...prev, validDays: settings.checkupPdf.defaultValidDays }))
    }
  }, [isNew, settings?.checkupPdf?.defaultValidDays]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data if store is empty
  useEffect(() => {
    if (checkups.length === 0) dispatch(fetchCheckups())
    if (patients.length === 0) dispatch(fetchPatients())
    if (tests.length === 0) dispatch(fetchTests())
    if (!isNew) dispatch(fetchMedicines())
  }, [dispatch, checkups.length, patients.length, tests.length, isNew])

  // Load checkup data into form when editing
  useEffect(() => {
    if (checkup) {
      setFormData({
        patientId: checkup.patientId || '',
        tests: checkup.tests || [],
        ownTests: checkup.ownTests !== false,
        doctorFees: checkup.doctorFees || '',
        paid: checkup.paid !== false,
        validDays: checkup.validDays || '',
        useESign: checkup.useESign !== false,
        weight: checkup.weight || '',
        height: checkup.height || ''
      })
      // Load additional fields
      setEditedNotes(checkup.notes || '')
      setEditedCommonNotes(checkup.commonNotes || '')
      setPrescriptionMedicines(checkup.prescriptionMedicines || [])
      setPrescriptionNotes(checkup.prescriptionNotes || '')
      setEditedGeneralTests(checkup.generalTests || {})
      setEditedLabResults(checkup.labResults || {})
      const testNotesMap = {}
      ;(checkup.tests || []).forEach(testItem => {
        testNotesMap[testItem.testId] = testItem.notes || ''
      })
      setEditedTestNotes(testNotesMap)
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
    const docFees = parseFloat(formData.doctorFees) || 0
    if (!formData.ownTests) return docFees
    const testsTotal = formData.tests.reduce((sum, testItem) => {
      const test = tests.find(t => t.id === testItem.testId)
      return sum + (test?.price || 0)
    }, 0)
    return testsTotal + docFees
  }, [formData.tests, formData.ownTests, formData.doctorFees, tests])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.patientId) {
      showError('Please select a patient')
      return
    }

    if (isFieldRequired('checkups', 'tests', true) && formData.tests.length === 0) {
      showError('Please select at least one test')
      return
    }

    setIsSubmitting(true)

    // Build tests array with notes for edit mode
    const testsWithNotes = formData.tests.map(testItem => ({
      ...testItem,
      notes: editedTestNotes[testItem.testId] || ''
    }))

    const checkupData = {
      ...formData,
      tests: testsWithNotes,
      total: calculateTotal()
    }

    // Add extra fields for edit mode
    if (!isNew) {
      checkupData.notes = editedNotes
      checkupData.commonNotes = editedCommonNotes
      checkupData.prescriptionMedicines = prescriptionMedicines
      checkupData.prescriptionNotes = prescriptionNotes
      checkupData.generalTests = editedGeneralTests
      checkupData.labResults = editedLabResults
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

  // Medicine helpers
  const handleAddMedicine = () => {
    setPrescriptionMedicines([...prescriptionMedicines, { medicineId: '', quantity: '', instructions: '' }])
  }
  const handleRemoveMedicine = (index) => {
    setPrescriptionMedicines(prescriptionMedicines.filter((_, i) => i !== index))
  }
  const handleMedicineChange = (index, field, value) => {
    const updated = [...prescriptionMedicines]
    updated[index] = { ...updated[index], [field]: value }
    setPrescriptionMedicines(updated)
  }
  const handleTestNoteChange = (testId, value) => {
    setEditedTestNotes(prev => ({ ...prev, [testId]: value }))
  }

  // Loading state
  if (loading && checkups.length === 0) {
    return <LoadingSpinner text="Loading data..." />
  }

  // Not found
  if (!isNew && !checkup && checkups.length > 0) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Breadcrumb
          items={[{ label: 'Checkups', path: '/checkups' }]}
          current="Not Found"
        />
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Checkup not found</h4>
            <p className="text-muted">The checkup you're looking for doesn't exist or has been removed.</p>
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
      <Breadcrumb
        items={[{ label: 'Checkups', path: '/checkups' }]}
        current={isNew ? 'New Checkup' : (checkup?.billNo || 'Edit Checkup')}
      />

      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h2 className="fs-responsive-lg mb-0">
              <FaClipboardCheck className="me-2 text-theme" />
              {isNew ? 'New Checkup / Bill' : 'Edit Checkup'}
            </h2>
            {!isNew && (
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => navigate(`/checkups/${id}/details`)}
              >
                <FaFileInvoice className="me-1" />
                Invoice / Prescription
              </Button>
            )}
          </div>
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
                {isFieldVisible('checkups', 'tests') && (<>
                <h6 className="section-heading mt-4">
                  {getFieldLabel('checkups', 'tests', 'Tests')}
                </h6>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {getFieldLabel('checkups', 'tests', 'Select Tests')}
                    {isFieldRequired('checkups', 'tests', true) && <span className="text-danger ms-1">*</span>}
                  </Form.Label>
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

                {isFieldVisible('checkups', 'ownTests') && (
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="ownTests"
                      label={<span>{getFieldLabel('checkups', 'ownTests', 'Own Tests')} <small className="text-muted">(uncheck if patient took tests elsewhere — no charge / commission)</small></span>}
                      checked={formData.ownTests}
                      onChange={(e) => setFormData({ ...formData, ownTests: e.target.checked })}
                    />
                  </Form.Group>
                )}

                {isFieldVisible('checkups', 'doctorFees') && (
                  <Form.Group className="mb-3">
                    <Form.Label>
                      {getFieldLabel('checkups', 'doctorFees', 'Doctor Fees (Rs.)')}
                      {isFieldRequired('checkups', 'doctorFees', false) && <span className="text-danger ms-1">*</span>}
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={formData.doctorFees}
                      onChange={(e) => setFormData({ ...formData, doctorFees: e.target.value })}
                      placeholder="Enter doctor fees"
                      required={isFieldRequired('checkups', 'doctorFees', false)}
                      style={{ maxWidth: '250px' }}
                    />
                  </Form.Group>
                )}

                {isFieldVisible('checkups', 'paid') && (
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="paid"
                      label={getFieldLabel('checkups', 'paid', 'Paid')}
                      checked={formData.paid}
                      onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>
                    Total Amount: <Badge className={formData.ownTests ? 'badge-theme-light fs-6' : 'bg-secondary fs-6'}>Rs. {calculateTotal().toFixed(2)}</Badge>
                    {!formData.ownTests && <small className="text-muted ms-2">(outside tests — doctor fees only)</small>}
                  </Form.Label>
                </Form.Group>
                </>)}

                {/* Weight/Height Section */}
                {(isFieldVisible('checkups', 'weight') || isFieldVisible('checkups', 'height')) && (
                  <>
                    <h6 className="section-heading mt-4">
                      Measurements (Optional)
                    </h6>

                    <Row>
                      {isFieldVisible('checkups', 'weight') && (
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              {getFieldLabel('checkups', 'weight', 'Weight (kg)')}
                              {isFieldRequired('checkups', 'weight', false) && <span className="text-danger ms-1">*</span>}
                            </Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="Enter weight in kg (optional)"
                              required={isFieldRequired('checkups', 'weight', false)}
                            />
                          </Form.Group>
                        </Col>
                      )}
                      {isFieldVisible('checkups', 'height') && (
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              {getFieldLabel('checkups', 'height', 'Height (cm)')}
                              {isFieldRequired('checkups', 'height', false) && <span className="text-danger ms-1">*</span>}
                            </Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              value={formData.height}
                              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                              placeholder="Enter height in cm (optional)"
                              required={isFieldRequired('checkups', 'height', false)}
                            />
                          </Form.Group>
                        </Col>
                      )}
                    </Row>
                  </>
                )}

                {/* === Additional fields (edit mode only) === */}
                {!isNew && checkup && (
                  <>
                    {/* Notes Section */}
                    {(isFieldVisible('checkups', 'notes') || isFieldVisible('checkups', 'commonNotes')) && (
                      <h6 className="section-heading mt-4">
                        <FaStickyNote className="me-2" />
                        Notes
                      </h6>
                    )}

                    {isFieldVisible('checkups', 'notes') && (
                      <Form.Group className="mb-3">
                        <Form.Label>{getFieldLabel('checkups', 'notes', 'Invoice Notes')} <small className="text-muted">(printed on invoice)</small></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                          placeholder="Add general notes for the invoice..."
                          style={{ fontSize: '0.9rem' }}
                        />
                      </Form.Group>
                    )}

                    {isFieldVisible('checkups', 'commonNotes') && (
                      <Form.Group className="mb-3">
                        <Form.Label>{getFieldLabel('checkups', 'commonNotes', 'Common Notes')} <small className="text-muted">(internal)</small></Form.Label>
                        <RichTextEditor
                          label=""
                          value={editedCommonNotes}
                          onChange={(value) => setEditedCommonNotes(value)}
                          placeholder="Add common notes for this checkup..."
                          height="150px"
                        />
                      </Form.Group>
                    )}

                    {/* Test-Specific Notes */}
                    {isFieldVisible('checkups', 'testNotes') && <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="mb-0">Test Notes <small className="text-muted">(per-test internal notes)</small></Form.Label>
                        <Button
                          size="sm"
                          className="btn-theme-success"
                          onClick={() => {
                            const el = document.getElementById('form-test-notes-dropdown')
                            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus() }
                          }}
                        >
                          <FaPlus className="me-1" /> Add
                        </Button>
                      </div>

                      <div className="mb-3 p-3" style={{ background: '#f8fafc', borderRadius: '6px' }}>
                        <Select
                          id="form-test-notes-dropdown"
                          value={selectedTestForNote}
                          options={formData.tests
                            .filter(ti => !editedTestNotes[ti.testId])
                            .map(ti => {
                              const t = tests.find(x => x.id === ti.testId)
                              return t ? { value: ti.testId, label: `${t.code} - ${t.name}` } : null
                            }).filter(Boolean)}
                          onChange={(option) => {
                            setSelectedTestForNote(option)
                            if (option) setTimeout(() => document.getElementById('form-new-test-note')?.focus(), 100)
                          }}
                          placeholder="Select a test to add notes..."
                          isClearable
                          styles={{ control: (b) => ({ ...b, fontSize: '0.9rem' }), menu: (b) => ({ ...b, fontSize: '0.9rem' }) }}
                        />
                        {selectedTestForNote && (
                          <div className="mt-2">
                            <Form.Control
                              id="form-new-test-note"
                              as="textarea"
                              rows={2}
                              placeholder={`Notes for ${selectedTestForNote.label}...`}
                              style={{ fontSize: '0.9rem' }}
                              onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                  const v = e.target.value.trim()
                                  if (v) { handleTestNoteChange(selectedTestForNote.value, v); setSelectedTestForNote(null) }
                                }
                              }}
                            />
                            <div className="d-flex gap-2 mt-1">
                              <Button size="sm" className="btn-theme-success" onClick={() => {
                                const v = document.getElementById('form-new-test-note')?.value.trim()
                                if (v) { handleTestNoteChange(selectedTestForNote.value, v); setSelectedTestForNote(null) }
                              }}><FaPlus className="me-1" /> Add</Button>
                              <Button size="sm" variant="secondary" onClick={() => setSelectedTestForNote(null)}>
                                <FaTimes className="me-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {formData.tests
                        .filter(ti => editedTestNotes[ti.testId])
                        .map(ti => {
                          const t = tests.find(x => x.id === ti.testId)
                          return t ? (
                            <div key={ti.testId} className="mb-2 p-2" style={{ border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span><strong className="text-theme">{t.code}</strong> - {t.name}</span>
                                <Button size="sm" variant="outline-danger" onClick={() => handleTestNoteChange(ti.testId, '')}><FaTrash /></Button>
                              </div>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={editedTestNotes[ti.testId] || ''}
                                onChange={(e) => handleTestNoteChange(ti.testId, e.target.value)}
                                style={{ fontSize: '0.9rem' }}
                              />
                            </div>
                          ) : null
                        })}
                    </div>}

                    {/* Prescription Section */}
                    {isFieldVisible('checkups', 'prescription') && (<>
                    <h6 className="section-heading mt-4">
                      <FaPrescriptionBottleAlt className="me-2" />
                      {getFieldLabel('checkups', 'prescription', 'Prescription')}
                      <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>{prescriptionMedicines.length}</Badge>
                    </h6>

                    <div className="d-flex justify-content-end mb-2">
                      <Button size="sm" onClick={handleAddMedicine} className="btn-theme-success">
                        <FaPlus className="me-1" /> Add Medicine
                      </Button>
                    </div>

                    {prescriptionMedicines.map((med, index) => {
                      const selectedMed = medicines.find(m => m.id === med.medicineId)
                      return (
                        <Card key={index} className="mb-2" style={{ border: '1px solid #cbd5e1' }}>
                          <Card.Body className="p-2 p-md-3">
                            <Row>
                              <Col md={5}>
                                <Form.Group className="mb-2">
                                  <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Medicine</Form.Label>
                                  <Select
                                    value={selectedMed ? {
                                      value: selectedMed.id,
                                      label: `${selectedMed.name} - ${Array.isArray(selectedMed.dosage) ? selectedMed.dosage.join(', ') : selectedMed.dosage} - ${selectedMed.brand}`
                                    } : null}
                                    onChange={(opt) => handleMedicineChange(index, 'medicineId', opt.value)}
                                    options={medicines.map(m => ({
                                      value: m.id,
                                      label: `${m.name} - ${Array.isArray(m.dosage) ? m.dosage.join(', ') : m.dosage} - ${m.brand}`
                                    }))}
                                    placeholder="Select medicine..."
                                    styles={{ control: (b) => ({ ...b, fontSize: '0.9rem' }), menu: (b) => ({ ...b, fontSize: '0.9rem' }) }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col xs={6} md={2}>
                                <Form.Group className="mb-2">
                                  <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Quantity</Form.Label>
                                  <Form.Control size="sm" type="text" value={med.quantity} onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)} placeholder="e.g., 10" />
                                </Form.Group>
                              </Col>
                              <Col xs={6} md={4}>
                                <Form.Group className="mb-2">
                                  <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Instructions</Form.Label>
                                  <Form.Control size="sm" type="text" value={med.instructions} onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)} placeholder="e.g., After meals" />
                                </Form.Group>
                              </Col>
                              <Col md={1} className="d-flex align-items-end">
                                <Button size="sm" variant="danger" onClick={() => handleRemoveMedicine(index)} className="mb-2"><FaTrash /></Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      )
                    })}

                    {isFieldVisible('checkups', 'prescriptionNotes') && (
                      <Form.Group className="mb-3 mt-2">
                        <Form.Label>{getFieldLabel('checkups', 'prescriptionNotes', 'Prescription Notes / Instructions')}</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={prescriptionNotes}
                          onChange={(e) => setPrescriptionNotes(e.target.value)}
                          placeholder="Additional instructions for the prescription..."
                          style={{ fontSize: '0.9rem' }}
                        />
                      </Form.Group>
                    )}
                    </>)}

                    {/* Valid Days & Use ESign */}
                    {(isFieldVisible('checkups', 'validDays') || isFieldVisible('checkups', 'useESign')) && (
                      <Row className="mt-3">
                        {isFieldVisible('checkups', 'validDays') && (
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                {getFieldLabel('checkups', 'validDays', 'Prescription Valid Days')}
                              </Form.Label>
                              <Form.Control
                                type="number"
                                value={formData.validDays}
                                onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
                                placeholder="30"
                                style={{ maxWidth: '150px' }}
                              />
                            </Form.Group>
                          </Col>
                        )}
                        {isFieldVisible('checkups', 'useESign') && (
                          <Col md={6}>
                            <Form.Group className="mb-3 d-flex align-items-center" style={{ minHeight: '58px' }}>
                              <Form.Check
                                type="switch"
                                id="useESign"
                                label={getFieldLabel('checkups', 'useESign', 'Use E-Signature')}
                                checked={formData.useESign}
                                onChange={(e) => setFormData({ ...formData, useESign: e.target.checked })}
                              />
                            </Form.Group>
                          </Col>
                        )}
                      </Row>
                    )}

                    {/* General Tests Section */}
                    {isFieldVisible('checkups', 'generalTests') && generalTestFields.length > 0 && (
                      <>
                        <h6 className="section-heading mt-4">
                          <FaStethoscope className="me-2" />
                          General Tests
                        </h6>

                        <Row>
                          {generalTestFields.map(({ key, label, children }) => {
                            if (children) {
                              return (
                                <Col xs={12} key={key} className="mb-3">
                                  <Form.Group>
                                    <Form.Label className="fw-semibold mb-1">{label}</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      type="text"
                                      value={editedGeneralTests[key] || ''}
                                      onChange={(e) => setEditedGeneralTests(prev => ({ ...prev, [key]: e.target.value }))}
                                      placeholder={`Enter ${label}...`}
                                    />
                                  </Form.Group>
                                  <div className="ps-3 mt-2">
                                    <Row>
                                      {children.map(({ key: ck, label: cl }) => (
                                        <Col xs={6} md={4} lg={3} key={ck} className="mb-2">
                                          <Form.Group>
                                            <Form.Label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.15rem' }}>{cl}</Form.Label>
                                            <Form.Control
                                              size="sm"
                                              type="text"
                                              value={editedGeneralTests[ck] || ''}
                                              onChange={(e) => setEditedGeneralTests(prev => ({ ...prev, [ck]: e.target.value }))}
                                              placeholder={cl}
                                            />
                                          </Form.Group>
                                        </Col>
                                      ))}
                                    </Row>
                                  </div>
                                </Col>
                              )
                            }
                            return (
                              <Col xs={6} md={4} lg={3} key={key} className="mb-3">
                                <Form.Group>
                                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: '0.9rem' }}>{label}</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="text"
                                    value={editedGeneralTests[key] || ''}
                                    onChange={(e) => setEditedGeneralTests(prev => ({ ...prev, [key]: e.target.value }))}
                                    placeholder={`Enter ${label}...`}
                                  />
                                </Form.Group>
                              </Col>
                            )
                          })}
                        </Row>
                      </>
                    )}

                    {/* Lab Results Section */}
                    {isFieldVisible('checkups', 'labResults') && labResultFields.length > 0 && (
                      <>
                        <h6 className="section-heading mt-4">
                          <FaVial className="me-2" />
                          Lab Results
                        </h6>

                        <Row>
                          {labResultFields.map(({ key, label, children }) => {
                            if (children) {
                              return (
                                <Col xs={12} key={key} className="mb-3">
                                  <Form.Group>
                                    <Form.Label className="fw-semibold mb-1">{label}</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      type="text"
                                      value={editedLabResults[key] || ''}
                                      onChange={(e) => setEditedLabResults(prev => ({ ...prev, [key]: e.target.value }))}
                                      placeholder={`Enter ${label}...`}
                                    />
                                  </Form.Group>
                                  <div className="ps-3 mt-2">
                                    <Row>
                                      {children.map(({ key: ck, label: cl }) => (
                                        <Col xs={6} md={4} lg={3} key={ck} className="mb-2">
                                          <Form.Group>
                                            <Form.Label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.15rem' }}>{cl}</Form.Label>
                                            <Form.Control
                                              size="sm"
                                              type="text"
                                              value={editedLabResults[ck] || ''}
                                              onChange={(e) => setEditedLabResults(prev => ({ ...prev, [ck]: e.target.value }))}
                                              placeholder={cl}
                                            />
                                          </Form.Group>
                                        </Col>
                                      ))}
                                    </Row>
                                  </div>
                                </Col>
                              )
                            }
                            return (
                              <Col xs={6} md={4} lg={3} key={key} className="mb-3">
                                <Form.Group>
                                  <Form.Label className="fw-semibold mb-1" style={{ fontSize: '0.9rem' }}>{label}</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="text"
                                    value={editedLabResults[key] || ''}
                                    onChange={(e) => setEditedLabResults(prev => ({ ...prev, [key]: e.target.value }))}
                                    placeholder={`Enter ${label}...`}
                                  />
                                </Form.Group>
                              </Col>
                            )
                          })}
                        </Row>
                      </>
                    )}
                  </>
                )}

                {isNew && (
                  <div className="info-box mt-3">
                    <p style={{ fontSize: '0.9rem', color: '#0369a1', marginBottom: 0 }}>
                      <strong>Note:</strong> You can add notes, prescriptions, and lab results after creating the checkup by editing it.
                    </p>
                  </div>
                )}
              </Card.Body>

              <Card.Footer className="entity-form-footer justify-content-end">
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
