import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Dropdown } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaFilePdf, FaClipboardCheck, FaTimes } from 'react-icons/fa'
import { fetchCheckups, addCheckup, updateCheckup, deleteCheckup, selectAllCheckups } from '../store/checkupsSlice'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { generateCheckupPDF } from '../utils/pdfGenerator'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'

// Tag-based Test Selector Component
const TestTagSelector = ({ tests, selectedTests, onToggle, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const availableTests = tests.filter(test => !selectedTests.includes(test.id))
  const filteredTests = availableTests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddTest = (testId) => {
    onToggle(testId)
    setSearchTerm('')
  }

  const getTestById = (testId) => tests.find(t => t.id === testId)

  return (
    <Form.Group className="mb-3">
      <Form.Label>Select Tests *</Form.Label>

      {/* Selected Tests as Tags */}
      <div className="mb-2 d-flex flex-wrap gap-2">
        {selectedTests.map(testId => {
          const test = getTestById(testId)
          if (!test) return null
          return (
            <Badge
              key={testId}
              bg="info"
              className="d-flex align-items-center gap-2 px-3 py-2"
              style={{ fontSize: '14px', cursor: 'pointer' }}
            >
              <span>{test.name}</span>
              <span className="text-white-50">Rs. {test.price.toFixed(2)}</span>
              <FaTimes
                size={14}
                onClick={() => !disabled && onToggle(testId)}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              />
            </Badge>
          )
        })}
        {selectedTests.length === 0 && (
          <span className="text-muted">No tests selected</span>
        )}
      </div>

      {/* Add Test Dropdown */}
      <div className="position-relative">
        <Form.Control
          type="text"
          placeholder="Search and add tests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          disabled={disabled}
        />

        {showDropdown && filteredTests.length > 0 && (
          <Card
            className="position-absolute w-100 mt-1 shadow-lg"
            style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}
          >
            <Card.Body className="p-0">
              {filteredTests.map(test => (
                <div
                  key={test.id}
                  className="p-3 border-bottom"
                  style={{ cursor: 'pointer' }}
                  onMouseDown={() => handleAddTest(test.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{test.name}</strong>
                      <br />
                      <small className="text-muted">{test.details}</small>
                    </div>
                    <Badge bg="secondary">Rs. {test.price.toFixed(2)}</Badge>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        )}
      </div>

      {availableTests.length === 0 && selectedTests.length > 0 && (
        <small className="text-muted">All available tests selected</small>
      )}
    </Form.Group>
  )
}

function Checkups() {
  const dispatch = useDispatch()
  const checkups = useSelector(selectAllCheckups)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)
  const { loading: checkupsLoading, error: checkupsError } = useSelector(state => state.checkups)
  const { loading: patientsLoading } = useSelector(state => state.patients)
  const { loading: testsLoading } = useSelector(state => state.tests)
  const [showModal, setShowModal] = useState(false)
  const [editingCheckup, setEditingCheckup] = useState(null)
  const [formData, setFormData] = useState({
    patientId: '',
    tests: [],
    notes: ''
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
    setFormData({ patientId: '', tests: [], notes: '' })
  }

  const handleShow = (checkup = null) => {
    if (checkup) {
      setEditingCheckup(checkup)
      setFormData({
        patientId: checkup.patientId,
        tests: checkup.tests,
        notes: checkup.notes
      })
    }
    setShowModal(true)
  }

  const handleTestToggle = (testId) => {
    setFormData(prev => ({
      ...prev,
      tests: prev.tests.includes(testId)
        ? prev.tests.filter(id => id !== testId)
        : [...prev.tests, testId]
    }))
  }

  const calculateTotal = () => {
    return formData.tests.reduce((sum, testId) => {
      const test = tests.find(t => t.id === testId)
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

  const handleGeneratePDF = (checkup) => {
    const patient = patients.find(p => p.id === checkup.patientId)
    if (patient) {
      generateCheckupPDF(checkup, patient, tests)
    }
  }

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId)
    return patient ? patient.name : 'Unknown'
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h2><FaClipboardCheck className="me-2 text-secondary" />Checkups / Billing</h2>
            <Button
              variant="secondary"
              onClick={() => handleShow()}
              className="mt-2 mt-md-0"
              disabled={patients.length === 0 || loading}
            >
              <FaPlus className="me-2" />New Checkup
            </Button>
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
                      <th>Bill ID</th>
                      <th>Patient</th>
                      <th>Tests Count</th>
                      <th>Total (Rs.)</th>
                      <th>Date/Time</th>
                      <th>Notes</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkups.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          No checkups recorded yet
                        </td>
                      </tr>
                    ) : (
                      checkups.map(checkup => (
                        <tr key={checkup.id}>
                          <td data-label="Bill ID"><Badge bg="info">#{checkup.id}</Badge></td>
                          <td data-label="Patient"><strong>{getPatientName(checkup.patientId)}</strong></td>
                          <td data-label="Tests Count">{checkup.tests.length}</td>
                          <td data-label="Total"><strong>Rs. {checkup.total.toFixed(2)}</strong></td>
                          <td data-label="Date/Time">{new Date(checkup.timestamp).toLocaleString()}</td>
                          <td data-label="Notes">{checkup.notes || '-'}</td>
                          <td data-label="Actions">
                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleGeneratePDF(checkup)}
                                disabled={loading}
                              >
                                <FaFilePdf />
                              </Button>
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleShow(checkup)}
                                disabled={loading}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(checkup.id)}
                                disabled={loading}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
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
          <Modal.Title>{editingCheckup ? 'Edit Checkup' : 'New Checkup / Bill'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select Patient *</Form.Label>
              <Form.Select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
              >
                <option value="">Choose a patient...</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.age}yr - {patient.mobile}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <TestTagSelector
              tests={tests}
              selectedTests={formData.tests}
              onToggle={handleTestToggle}
              disabled={loading}
            />

            <Form.Group className="mb-3">
              <Form.Label>
                Total Amount: <Badge bg="success" className="fs-6">Rs. {calculateTotal().toFixed(2)}</Badge>
              </Form.Label>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes / Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special notes or remarks..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="secondary" type="submit">
              {editingCheckup ? 'Update' : 'Create'} Checkup
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Checkups
