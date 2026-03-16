import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap'
import { FaClipboardCheck, FaSave, FaTrash, FaPlus, FaTimes, FaStickyNote, FaPrescriptionBottleAlt, FaVial, FaFileInvoice, FaStethoscope, FaUserInjured, FaFlask, FaCog, FaListAlt, FaPills } from 'react-icons/fa'
import { Breadcrumb, RichTextEditor, PageHeader } from '../components/ui'
import Select from 'react-select'
import { fetchCheckups, addCheckup, updateCheckup, deleteCheckup, selectAllCheckups } from '../store/checkupsSlice'
import { firestoreService } from '../services/firestoreService'
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
  const { success, error: showError, confirm } = useNotification()
  const { checkPermission } = usePermission()
  const { user } = useSelector(state => state.auth)
  const isEditorOrAbove = ['superadmin', 'admin', 'maintainer', 'editor'].includes(user?.role)
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
  const [activeTab, setActiveTab] = useState('patient')
  const [appointmentPrefill, setAppointmentPrefill] = useState(null)

  // Additional fields (edit mode only)
  const [editedNotes, setEditedNotes] = useState('')
  const [editedCommonNotes, setEditedCommonNotes] = useState('')
  const [editedTestNotes, setEditedTestNotes] = useState({})
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [editedGeneralTests, setEditedGeneralTests] = useState({})
  const [editedLabResults, setEditedLabResults] = useState({})
  const [selectedTestForNote, setSelectedTestForNote] = useState(null)

  // Set defaults from settings for new checkups
  useEffect(() => {
    if (!isNew) return
    const updates = {}
    if (settings?.checkupPdf?.defaultValidDays && !formData.validDays) updates.validDays = settings.checkupPdf.defaultValidDays
    if (settings?.checkupPdf?.defaultDoctorFees && !formData.doctorFees) updates.doctorFees = settings.checkupPdf.defaultDoctorFees
    if (Object.keys(updates).length) setFormData(prev => ({ ...prev, ...updates }))
  }, [isNew, settings?.checkupPdf?.defaultValidDays, settings?.checkupPdf?.defaultDoctorFees]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data if store is empty
  useEffect(() => {
    if (checkups.length === 0) dispatch(fetchCheckups())
    if (patients.length === 0) dispatch(fetchPatients())
    if (tests.length === 0) dispatch(fetchTests())
    if (!isNew) dispatch(fetchMedicines())
  }, [dispatch, checkups.length, patients.length, tests.length, isNew])

  // Load appointment prefill data (from Appointments page approval)
  useEffect(() => {
    if (!isNew) return
    try {
      const raw = sessionStorage.getItem('appointmentPrefill')
      if (!raw) return
      const prefill = JSON.parse(raw)
      setAppointmentPrefill(prefill)
      sessionStorage.removeItem('appointmentPrefill')

      // Try to find existing patient by mobile or name
      if (prefill.isOwn && prefill.userId) {
        // Self-appointment: find patient linked to this user
        const linked = patients.find(p => p.linkedUserId === prefill.userId)
        if (linked) {
          setFormData(prev => ({ ...prev, patientId: linked.id }))
        }
      } else if (prefill.patient?.mobile || prefill.patient?.name) {
        const mobile = prefill.patient.mobile?.replace(/\s+/g, '')
        const match = patients.find(p =>
          (mobile && p.mobile?.replace(/\s+/g, '') === mobile) ||
          (prefill.patient.name && p.name?.toLowerCase() === prefill.patient.name.toLowerCase())
        )
        if (match) {
          setFormData(prev => ({ ...prev, patientId: match.id }))
        } else {
          // No match — open new patient form pre-filled
          setShowNewPatientForm(true)
          setNewPatientData(prev => ({
            ...prev,
            name: prefill.patient.name || '',
            age: prefill.patient.age || '',
            gender: prefill.patient.gender || 'Male',
            mobile: prefill.patient.mobile || '',
          }))
        }
      }
    } catch { /* ignore parse errors */ }
  }, [isNew, patients.length]) // eslint-disable-line react-hooks/exhaustive-deps

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
        // If from appointment approval, mark appointment as approved
        if (appointmentPrefill?.appointmentId) {
          await firestoreService.approveAppointment(appointmentPrefill.appointmentId, result.payload.id)
          // Also link patient to user if isOwn
          if (appointmentPrefill.isOwn && appointmentPrefill.userId && formData.patientId) {
            await firestoreService.linkPatientToUser(appointmentPrefill.userId, formData.patientId).catch(() => {})
          }
          setAppointmentPrefill(null)
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
    if (!(await confirm('Are you sure you want to delete this checkup?'))) return
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

  const TABS = [
    { key: 'patient', label: 'Patient', icon: FaUserInjured },
    ...(isEditorOrAbove ? [
      { key: 'tests', label: 'Tests', icon: FaFlask },
      { key: 'extra', label: 'Extra', icon: FaCog },
      { key: 'medicine', label: 'Medicine', icon: FaPills },
    ] : []),
    { key: 'summary', label: 'Summary', icon: FaListAlt },
  ]

  // Helper to render general/lab test fields
  const renderTestFields = (fields, state, setState) => (
    <Row>
      {fields.map(({ key, label, children }) => {
        if (children) {
          return (
            <Col xs={12} key={key} className="mb-2">
              <Form.Group>
                <Form.Label className="fw-semibold mb-1" style={{ fontSize: '0.82rem' }}>{label}</Form.Label>
                <Form.Control size="sm" type="text" value={state[key] || ''} onChange={(e) => setState(prev => ({ ...prev, [key]: e.target.value }))} placeholder={label} />
              </Form.Group>
              <div className="ps-3 mt-1">
                <Row>
                  {children.map(({ key: ck, label: cl }) => (
                    <Col xs={6} md={4} lg={3} key={ck} className="mb-1">
                      <Form.Group>
                        <Form.Label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>{cl}</Form.Label>
                        <Form.Control size="sm" type="text" value={state[ck] || ''} onChange={(e) => setState(prev => ({ ...prev, [ck]: e.target.value }))} placeholder={cl} />
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          )
        }
        return (
          <Col xs={6} md={4} lg={3} key={key} className="mb-2">
            <Form.Group>
              <Form.Label className="fw-semibold mb-1" style={{ fontSize: '0.82rem' }}>{label}</Form.Label>
              <Form.Control size="sm" type="text" value={state[key] || ''} onChange={(e) => setState(prev => ({ ...prev, [key]: e.target.value }))} placeholder={label} />
            </Form.Group>
          </Col>
        )
      })}
    </Row>
  )

  return (
    <Container fluid className="p-3 p-md-4 d-flex flex-column" style={{ height: 'calc(100vh - 52px)' }}>
      <div className="flex-shrink-0">
        <Breadcrumb items={[{ label: 'Checkups', path: '/checkups' }]} current={isNew ? 'New Checkup' : (checkup?.billNo || 'Edit')} />

        {/* Header + Actions */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <PageHeader icon={FaClipboardCheck} title={isNew ? 'New Checkup' : `Edit: ${checkup?.billNo || ''}`} />
          <div className="d-flex gap-2">
            {!isNew && (
              <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/checkups/${id}/details`)} style={{ fontSize: '0.72rem' }}>
                <FaFileInvoice className="me-1" size={10} /> Invoice / Rx
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="outline-danger" onClick={handleDelete} disabled={isSubmitting} style={{ fontSize: '0.72rem' }}>
                <FaTrash className="me-1" size={10} /> Delete
              </Button>
            )}
            <Button size="sm" type="submit" form="checkup-form" disabled={isSubmitting || loading} style={{ fontSize: '0.72rem', backgroundColor: '#0891B2', borderColor: '#0891B2' }}>
              <FaSave className="me-1" size={10} />
              {isSubmitting ? 'Saving...' : (isNew ? 'Create' : 'Update')}
            </Button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="border-bottom" style={{ backgroundColor: '#fff' }}>
          <div className="d-flex flex-wrap gap-0">
            {TABS.map(tab => (
              <button key={tab.key} type="button" className={`btn btn-link text-decoration-none px-3 py-2 ${activeTab === tab.key ? 'fw-semibold' : ''}`} onClick={() => setActiveTab(tab.key)}
                style={{ fontSize: '0.8rem', color: activeTab === tab.key ? '#0891B2' : '#64748b', borderRadius: 0, borderBottom: activeTab === tab.key ? '2px solid #0891B2' : '2px solid transparent' }}>
                <tab.icon className="me-1" size={13} />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: 12 }}>
        <Form id="checkup-form" onSubmit={handleSubmit}>

          {/* ===== PATIENT TAB ===== */}
          {activeTab === 'patient' && (
            <div style={{ maxWidth: 700 }}>
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: '0.82rem', fontWeight: 500 }}>Select Patient *</Form.Label>
                <Select
                  options={patients.map(p => ({ value: p.id, label: `${p.name} - ${p.age}yr - ${p.mobile}`, patient: p }))}
                  value={patients.filter(p => p.id === formData.patientId).map(p => ({ value: p.id, label: `${p.name} - ${p.age}yr - ${p.mobile}` }))[0] || null}
                  onChange={handlePatientSelect}
                  placeholder="Search patient by name, mobile..."
                  isClearable
                  formatOptionLabel={(option) => (
                    <div><strong style={{ fontSize: '0.82rem' }}>{option.patient?.name || option.label.split(' - ')[0]}</strong>
                      <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>{option.patient?.age}yr, {option.patient?.gender} - {option.patient?.mobile}</small>
                    </div>
                  )}
                  styles={{ control: (b) => ({ ...b, fontSize: '0.82rem', minHeight: 34 }), menu: (b) => ({ ...b, fontSize: '0.82rem' }) }}
                />
              </Form.Group>

              {patient && (
                <div className="p-2 mb-2 rounded" style={{ backgroundColor: '#f0fdfa', fontSize: '0.78rem' }}>
                  <strong>{patient.name}</strong> &middot; {patient.age}yr &middot; {patient.gender} &middot; {patient.mobile}
                </div>
              )}

              {!patient && (
                <div className="mb-2">
                  <button type="button" className="btn btn-link p-0" style={{ fontSize: '0.78rem', color: '#0891B2' }} onClick={() => setShowNewPatientForm(!showNewPatientForm)}>
                    {showNewPatientForm ? 'Cancel' : '+ Add New Patient'}
                  </button>
                </div>
              )}

              {!patient && showNewPatientForm && (
                <Card className="border-0 shadow-sm mb-2">
                  <Card.Body className="p-3">
                    <small className="fw-bold text-muted d-block mb-2">NEW PATIENT</small>
                    <Row>
                      {isFieldVisible('patients', 'name') && <Col md={6}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>{getFieldLabel('patients', 'name', 'Name')} *</Form.Label><Form.Control size="sm" value={newPatientData.name} onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })} required /></Form.Group></Col>}
                      {isFieldVisible('patients', 'age') && <Col md={3}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>{getFieldLabel('patients', 'age', 'Age')} *</Form.Label><Form.Control size="sm" type="number" value={newPatientData.age} onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })} required /></Form.Group></Col>}
                      {isFieldVisible('patients', 'gender') && <Col md={3}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>Gender *</Form.Label><Form.Select size="sm" value={newPatientData.gender} onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></Form.Select></Form.Group></Col>}
                      {isFieldVisible('patients', 'mobile') && <Col md={6}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>Mobile *</Form.Label><Form.Control size="sm" type="tel" value={newPatientData.mobile} onChange={(e) => setNewPatientData({ ...newPatientData, mobile: e.target.value })} required /></Form.Group></Col>}
                      {isFieldVisible('patients', 'email') && <Col md={6}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>Email</Form.Label><Form.Control size="sm" type="email" value={newPatientData.email} onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })} /></Form.Group></Col>}
                      {isFieldVisible('patients', 'address') && <Col md={12}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>Address</Form.Label><Form.Control size="sm" as="textarea" rows={1} value={newPatientData.address} onChange={(e) => setNewPatientData({ ...newPatientData, address: e.target.value })} /></Form.Group></Col>}
                    </Row>
                    <Button size="sm" onClick={handleCreateNewPatient} style={{ fontSize: '0.75rem', backgroundColor: '#0891B2', borderColor: '#0891B2' }}>
                      <FaPlus className="me-1" size={10} /> Create & Select
                    </Button>
                  </Card.Body>
                </Card>
              )}

              {/* Payment & Total */}
              <div className="mt-3 p-2 rounded" style={{ border: '1px solid #e2e8f0' }}>
                <Row className="align-items-center">
                  {isFieldVisible('checkups', 'paid') && isEditorOrAbove && (
                    <Col xs={6}>
                      <Form.Check type="switch" id="paid-patient" label={<span style={{ fontSize: '0.82rem', fontWeight: 500 }}>Paid</span>}
                        checked={formData.paid} onChange={(e) => setFormData({ ...formData, paid: e.target.checked })} />
                    </Col>
                  )}
                  <Col xs={6} className="text-end">
                    <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Total</small>
                    <strong style={{ fontSize: '1rem', color: formData.paid ? '#16a34a' : '#dc2626' }}>Rs. {calculateTotal().toFixed(2)}</strong>
                  </Col>
                </Row>
              </div>

              {isNew && (
                <div className="p-2 rounded mt-2" style={{ backgroundColor: '#f0f9ff', fontSize: '0.78rem', color: '#0369a1' }}>
                  <strong>Tip:</strong> After creating, you can add notes, prescriptions, and lab results by editing.
                </div>
              )}
            </div>
          )}

          {/* ===== TESTS TAB ===== */}
          {activeTab === 'tests' && (
            <div style={{ maxWidth: 800 }}>
              {/* Appointment request note */}
              {appointmentPrefill?.tests?.length > 0 && (
                <div className="mb-3 p-2 rounded d-flex align-items-start gap-2" style={{ background: '#fefce8', border: '1px solid #fde68a', fontSize: '0.78rem' }}>
                  <FaStickyNote size={11} style={{ color: '#d97706', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#92400e' }}>Requested:</strong>{' '}
                    <span style={{ color: '#78350f' }}>{appointmentPrefill.tests.join(', ')}</span>
                    {appointmentPrefill.notes && <div className="mt-1" style={{ color: '#a16207' }}><strong>Note:</strong> {appointmentPrefill.notes}</div>}
                  </div>
                </div>
              )}
              {isFieldVisible('checkups', 'tests') && (
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '0.82rem', fontWeight: 500 }}>Select Tests {isFieldRequired('checkups', 'tests', true) && <span className="text-danger">*</span>}</Form.Label>
                  <Select isMulti options={tests.map(t => ({ value: t.id, label: t.name, code: t.code, price: t.price, details: t.details }))}
                    value={tests.filter(t => formData.tests.some(ti => ti.testId === t.id)).map(t => ({ value: t.id, label: t.name, code: t.code }))}
                    onChange={handleTestChange} isDisabled={loading} placeholder="Search tests..."
                    formatOptionLabel={(option, { context }) => context === 'value'
                      ? <span style={{ fontSize: '0.78rem' }}><strong>{option.code}</strong> - {option.label}</span>
                      : <div className="d-flex justify-content-between" style={{ fontSize: '0.82rem' }}><div><strong>{option.code}</strong> - {option.label}{option.details && <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>{option.details}</small>}</div><Badge bg="light" text="dark" style={{ fontSize: '0.68rem' }}>Rs.{option.price?.toFixed(2)}</Badge></div>}
                    styles={testSelectStyles} />
                </Form.Group>
              )}

              <Row className="mb-2">
                {isFieldVisible('checkups', 'ownTests') && <Col xs={6} md={4}><Form.Check type="switch" id="ownTests" label={<span style={{ fontSize: '0.78rem' }}>Own Tests</span>} checked={formData.ownTests} onChange={(e) => setFormData({ ...formData, ownTests: e.target.checked })} /></Col>}
              </Row>

              {(isFieldVisible('checkups', 'weight') || isFieldVisible('checkups', 'height')) && (
                <Row className="mb-3">
                  {isFieldVisible('checkups', 'weight') && <Col xs={6} md={4}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>Weight (kg)</Form.Label><Form.Control size="sm" type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="kg" /></Form.Group></Col>}
                  {isFieldVisible('checkups', 'height') && <Col xs={6} md={4}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>Height (cm)</Form.Label><Form.Control size="sm" type="number" step="0.1" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="cm" /></Form.Group></Col>}
                </Row>
              )}

              {/* General Tests */}
              {!isNew && checkup && isFieldVisible('checkups', 'generalTests') && generalTestFields.length > 0 && (
                <div className="mb-3">
                  <small className="fw-bold text-muted d-block mb-2">GENERAL TESTS</small>
                  {renderTestFields(generalTestFields, editedGeneralTests, setEditedGeneralTests)}
                </div>
              )}

              {/* Lab Results */}
              {!isNew && checkup && isFieldVisible('checkups', 'labResults') && labResultFields.length > 0 && (
                <div className="mb-3">
                  <small className="fw-bold text-muted d-block mb-2">LAB RESULTS</small>
                  {renderTestFields(labResultFields, editedLabResults, setEditedLabResults)}
                </div>
              )}

              {/* Test Notes - in Tests tab */}
              {!isNew && checkup && isFieldVisible('checkups', 'testNotes') && formData.tests.length > 0 && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="fw-bold text-muted">TEST NOTES</small>
                    <Button size="sm" variant="outline-secondary" style={{ fontSize: '0.72rem' }} onClick={() => { const el = document.getElementById('form-test-notes-dropdown'); if (el) el.focus() }}>
                      <FaPlus className="me-1" size={9} /> Add
                    </Button>
                  </div>
                  <div className="mb-2 p-2 rounded" style={{ background: '#f8f9fa' }}>
                    <Select id="form-test-notes-dropdown" value={selectedTestForNote}
                      options={formData.tests.filter(ti => !editedTestNotes[ti.testId]).map(ti => { const t = tests.find(x => x.id === ti.testId); return t ? { value: ti.testId, label: `${t.code} - ${t.name}` } : null }).filter(Boolean)}
                      onChange={(opt) => { setSelectedTestForNote(opt); if (opt) setTimeout(() => document.getElementById('form-new-test-note')?.focus(), 100) }}
                      placeholder="Select test..." isClearable styles={{ control: (b) => ({ ...b, fontSize: '0.8rem', minHeight: 34 }), menu: (b) => ({ ...b, fontSize: '0.8rem' }) }} />
                    {selectedTestForNote && (
                      <div className="mt-1">
                        <Form.Control id="form-new-test-note" as="textarea" rows={2} size="sm" placeholder={`Notes for ${selectedTestForNote.label}...`}
                          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { const v = e.target.value.trim(); if (v) { handleTestNoteChange(selectedTestForNote.value, v); setSelectedTestForNote(null) } } }} />
                        <div className="d-flex gap-1 mt-1">
                          <Button size="sm" style={{ fontSize: '0.72rem', backgroundColor: '#0891B2', borderColor: '#0891B2' }} onClick={() => { const v = document.getElementById('form-new-test-note')?.value.trim(); if (v) { handleTestNoteChange(selectedTestForNote.value, v); setSelectedTestForNote(null) } }}>Add</Button>
                          <Button size="sm" variant="outline-secondary" style={{ fontSize: '0.72rem' }} onClick={() => setSelectedTestForNote(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.tests.filter(ti => editedTestNotes[ti.testId]).map(ti => { const t = tests.find(x => x.id === ti.testId); return t ? (
                    <div key={ti.testId} className="mb-1 p-2 rounded" style={{ border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                      <div className="d-flex justify-content-between mb-1"><span><strong>{t.code}</strong> - {t.name}</span><button type="button" className="btn btn-sm btn-outline-danger" style={{ padding: '0 4px', fontSize: '0.65rem' }} onClick={() => handleTestNoteChange(ti.testId, '')}><FaTrash size={9} /></button></div>
                      <Form.Control as="textarea" rows={1} size="sm" value={editedTestNotes[ti.testId] || ''} onChange={(e) => handleTestNoteChange(ti.testId, e.target.value)} />
                    </div>
                  ) : null })}
                </div>
              )}
            </div>
          )}

          {/* ===== EXTRA TAB (edit only) ===== */}
          {activeTab === 'extra' && isEditorOrAbove && (
            <div style={{ maxWidth: 700 }}>
              {/* Doctor Fees */}
              {isFieldVisible('checkups', 'doctorFees') && (
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: '0.82rem', fontWeight: 500 }}>Doctor Fees (Rs.)</Form.Label>
                  <Form.Control size="sm" type="number" step="0.01" value={formData.doctorFees} onChange={(e) => setFormData({ ...formData, doctorFees: e.target.value })} placeholder="0.00" style={{ maxWidth: '200px' }} />
                </Form.Group>
              )}

              {/* Notes */}
              {isFieldVisible('checkups', 'notes') && (
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: '0.82rem', fontWeight: 500 }}>Invoice Notes <small className="text-muted">(printed on invoice)</small></Form.Label>
                  <Form.Control as="textarea" rows={2} size="sm" value={editedNotes} onChange={(e) => setEditedNotes(e.target.value)} placeholder="Notes for invoice..." />
                </Form.Group>
              )}
              {isFieldVisible('checkups', 'commonNotes') && (
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '0.82rem', fontWeight: 500 }}>Common Notes <small className="text-muted">(internal)</small></Form.Label>
                  <RichTextEditor label="" value={editedCommonNotes} onChange={setEditedCommonNotes} placeholder="Internal notes..." height="120px" />
                </Form.Group>
              )}

              {/* Valid Days & ESign */}
              <Row className="mb-2">
                {isFieldVisible('checkups', 'validDays') && <Col xs={6} md={4}><Form.Group className="mb-2"><Form.Label style={{ fontSize: '0.78rem' }}>Valid Days</Form.Label><Form.Control size="sm" type="number" value={formData.validDays} onChange={(e) => setFormData({ ...formData, validDays: e.target.value })} placeholder="30" /></Form.Group></Col>}
                {isFieldVisible('checkups', 'useESign') && <Col xs={6} md={4} className="d-flex align-items-end mb-2"><Form.Check type="switch" id="useESign" label={<span style={{ fontSize: '0.78rem' }}>E-Signature</span>} checked={formData.useESign} onChange={(e) => setFormData({ ...formData, useESign: e.target.checked })} /></Col>}
              </Row>
            </div>
          )}

          {/* ===== MEDICINE TAB (edit only) ===== */}
          {activeTab === 'medicine' && isEditorOrAbove && isFieldVisible('checkups', 'prescription') && (
            <div style={{ maxWidth: 800 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="fw-bold text-muted">PRESCRIPTION ({prescriptionMedicines.length})</small>
                <Button size="sm" onClick={handleAddMedicine} style={{ fontSize: '0.72rem', backgroundColor: '#0891B2', borderColor: '#0891B2' }}>
                  <FaPlus className="me-1" size={10} /> Add Medicine
                </Button>
              </div>

              {prescriptionMedicines.map((med, index) => {
                const selectedMed = medicines.find(m => m.id === med.medicineId)
                return (
                  <div key={index} className="mb-2 p-2 rounded" style={{ border: '1px solid #e2e8f0' }}>
                    <Row>
                      <Col md={5}>
                        <Form.Label style={{ fontSize: '0.75rem', color: '#64748b' }}>Medicine</Form.Label>
                        <Select value={selectedMed ? { value: selectedMed.id, label: `${selectedMed.name} - ${Array.isArray(selectedMed.dosage) ? selectedMed.dosage.join(', ') : selectedMed.dosage}` } : null}
                          onChange={(opt) => handleMedicineChange(index, 'medicineId', opt.value)}
                          options={medicines.map(m => ({ value: m.id, label: `${m.name} - ${Array.isArray(m.dosage) ? m.dosage.join(', ') : m.dosage} - ${m.brand}` }))}
                          placeholder="Select..." styles={{ control: (b) => ({ ...b, fontSize: '0.8rem', minHeight: 34 }), menu: (b) => ({ ...b, fontSize: '0.8rem' }) }} />
                      </Col>
                      <Col xs={4} md={2}><Form.Label style={{ fontSize: '0.75rem', color: '#64748b' }}>Qty</Form.Label><Form.Control size="sm" value={med.quantity} onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)} placeholder="10" /></Col>
                      <Col xs={6} md={4}><Form.Label style={{ fontSize: '0.75rem', color: '#64748b' }}>Instructions</Form.Label><Form.Control size="sm" value={med.instructions} onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)} placeholder="After meals" /></Col>
                      <Col xs={2} md={1} className="d-flex align-items-end pb-1"><button type="button" className="btn btn-sm btn-outline-danger" style={{ padding: '2px 6px' }} onClick={() => handleRemoveMedicine(index)}><FaTrash size={10} /></button></Col>
                    </Row>
                  </div>
                )
              })}

              {isFieldVisible('checkups', 'prescriptionNotes') && (
                <Form.Group className="mt-2">
                  <Form.Label style={{ fontSize: '0.78rem' }}>Prescription Notes</Form.Label>
                  <Form.Control as="textarea" rows={2} size="sm" value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} placeholder="Additional instructions..." />
                </Form.Group>
              )}
            </div>
          )}

          {/* ===== SUMMARY TAB (edit only) ===== */}
          {activeTab === 'summary' && (
            <div style={{ maxWidth: 600 }}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-3">
                  <small className="fw-bold text-muted d-block mb-2">CHECKUP SUMMARY</small>
                  <table className="table table-sm mb-0" style={{ fontSize: '0.82rem' }}>
                    <tbody>
                      <tr><td className="text-muted" style={{ width: '40%' }}>Bill No</td><td><strong>{checkup.billNo}</strong></td></tr>
                      <tr><td className="text-muted">Patient</td><td><strong>{patient?.name}</strong> &middot; {patient?.age}yr &middot; {patient?.gender}</td></tr>
                      <tr><td className="text-muted">Tests</td><td>{formData.tests.length} test{formData.tests.length !== 1 ? 's' : ''}</td></tr>
                      <tr><td className="text-muted">Own Tests</td><td>{formData.ownTests ? 'Yes' : 'No (outside)'}</td></tr>
                      <tr><td className="text-muted">Doctor Fees</td><td>Rs. {parseFloat(formData.doctorFees || 0).toFixed(2)}</td></tr>
                      <tr><td className="text-muted">Total</td><td><strong className="text-success">Rs. {calculateTotal().toFixed(2)}</strong></td></tr>
                      <tr><td className="text-muted">Paid</td><td>{formData.paid ? <Badge bg="success" style={{ fontSize: '0.7rem' }}>Paid</Badge> : <Badge bg="warning" text="dark" style={{ fontSize: '0.7rem' }}>Unpaid</Badge>}</td></tr>
                      {formData.weight && <tr><td className="text-muted">Weight</td><td>{formData.weight} kg</td></tr>}
                      {formData.height && <tr><td className="text-muted">Height</td><td>{formData.height} cm</td></tr>}
                      <tr><td className="text-muted">Prescriptions</td><td>{prescriptionMedicines.length} medicine{prescriptionMedicines.length !== 1 ? 's' : ''}</td></tr>
                      <tr><td className="text-muted">E-Signature</td><td>{formData.useESign ? 'Yes' : 'No'}</td></tr>
                    </tbody>
                  </table>

                  {/* Tests breakdown */}
                  {formData.tests.length > 0 && (
                    <div className="mt-3">
                      <small className="fw-bold text-muted d-block mb-1">TESTS</small>
                      {formData.tests.map(ti => {
                        const t = tests.find(x => x.id === ti.testId)
                        return t ? <div key={ti.testId} className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}><span>{t.code} - {t.name}</span><span>Rs. {t.price?.toFixed(2)}</span></div> : null
                      })}
                    </div>
                  )}

                  {/* Medicines breakdown */}
                  {prescriptionMedicines.length > 0 && (
                    <div className="mt-3">
                      <small className="fw-bold text-muted d-block mb-1">MEDICINES</small>
                      {prescriptionMedicines.map((med, i) => {
                        const m = medicines.find(x => x.id === med.medicineId)
                        return m ? <div key={i} className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.78rem' }}><span>{m.name}</span><span>{med.quantity} &middot; {med.instructions}</span></div> : null
                      })}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}

        </Form>
      </div>
    </Container>
  )
}

export default CheckupForm
