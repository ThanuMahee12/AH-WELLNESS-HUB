import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Modal, Form } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaUserInjured } from 'react-icons/fa'
import { fetchPatients, addPatient, updatePatient, deletePatient } from '../store/patientsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'

function Patients() {
  const dispatch = useDispatch()
  const { patients, loading, error } = useSelector(state => state.patients)
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mobile: '',
    address: '',
    email: ''
  })

  useEffect(() => {
    dispatch(fetchPatients())
  }, [dispatch])

  const handleClose = () => {
    setShowModal(false)
    setEditingPatient(null)
    setFormData({ name: '', age: '', gender: 'Male', mobile: '', address: '', email: '' })
  }

  const handleShow = (patient = null) => {
    if (patient) {
      setEditingPatient(patient)
      setFormData(patient)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const patientData = {
      ...formData,
      age: parseInt(formData.age)
    }

    if (editingPatient) {
      await dispatch(updatePatient({ id: editingPatient.id, ...patientData }))
    } else {
      await dispatch(addPatient(patientData))
    }
    handleClose()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      await dispatch(deletePatient(id))
    }
  }

  if (loading && patients.length === 0) {
    return <LoadingSpinner text="Loading patients..." />
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h2><FaUserInjured className="me-2 text-primary" />Patients Management</h2>
            <Button variant="primary" onClick={() => handleShow()} className="mt-2 mt-md-0">
              <FaPlus className="me-2" />Add New Patient
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <ErrorAlert error={error} />
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table striped hover className="mb-0">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          No patients registered yet
                        </td>
                      </tr>
                    ) : (
                      patients.map(patient => (
                        <tr key={patient.id}>
                          <td>{patient.id}</td>
                          <td><strong>{patient.name}</strong></td>
                          <td>{patient.age}</td>
                          <td>{patient.gender}</td>
                          <td>{patient.mobile}</td>
                          <td>{patient.email || '-'}</td>
                          <td className="text-truncate" style={{ maxWidth: '150px' }}>{patient.address}</td>
                          <td className="text-center">
                            <Button
                              variant="warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleShow(patient)}
                              disabled={loading}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(patient.id)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </Button>
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
          <Modal.Title>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Patient Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Age *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender *</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingPatient ? 'Update' : 'Add'} Patient
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Patients
