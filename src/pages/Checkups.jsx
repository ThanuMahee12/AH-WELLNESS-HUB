import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaFilePdf, FaClipboardCheck } from 'react-icons/fa'
import { fetchCheckups, addCheckup, updateCheckup, deleteCheckup, selectAllCheckups } from '../store/checkupsSlice'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { generateCheckupPDF } from '../utils/pdfGenerator'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'

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

            <Form.Group className="mb-3">
              <Form.Label>Select Tests * (Click to toggle)</Form.Label>
              <Card>
                <Card.Body>
                  {tests.map(test => (
                    <Form.Check
                      key={test.id}
                      type="checkbox"
                      id={`test-${test.id}`}
                      label={
                        <div className="d-flex justify-content-between align-items-center w-100">
                          <div>
                            <strong>{test.name}</strong>
                            <br />
                            <small className="text-muted">{test.details}</small>
                          </div>
                          <Badge bg="secondary">Rs. {test.price.toFixed(2)}</Badge>
                        </div>
                      }
                      checked={formData.tests.includes(test.id)}
                      onChange={() => handleTestToggle(test.id)}
                      className="mb-2 p-2 border rounded"
                    />
                  ))}
                  {tests.length === 0 && (
                    <div className="text-muted">No tests available. Please add tests first.</div>
                  )}
                </Card.Body>
              </Card>
            </Form.Group>

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
