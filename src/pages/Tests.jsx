import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Modal, Form } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaFlask } from 'react-icons/fa'
import { fetchTests, addTest, updateTest, deleteTest } from '../store/testsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'

function Tests() {
  const dispatch = useDispatch()
  const { tests, loading, error } = useSelector(state => state.tests)
  const [showModal, setShowModal] = useState(false)
  const [editingTest, setEditingTest] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    details: '',
    rules: ''
  })

  useEffect(() => {
    dispatch(fetchTests())
  }, [dispatch])

  const handleClose = () => {
    setShowModal(false)
    setEditingTest(null)
    setFormData({ name: '', price: '', details: '', rules: '' })
  }

  const handleShow = (test = null) => {
    if (test) {
      setEditingTest(test)
      setFormData(test)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const testData = {
      ...formData,
      price: parseFloat(formData.price)
    }

    if (editingTest) {
      await dispatch(updateTest({ id: editingTest.id, ...testData }))
    } else {
      await dispatch(addTest(testData))
    }
    handleClose()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      await dispatch(deleteTest(id))
    }
  }

  if (loading && tests.length === 0) {
    return <LoadingSpinner text="Loading tests..." />
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h2><FaFlask className="me-2 text-secondary" />Blood Tests Management</h2>
            <Button variant="secondary" onClick={() => handleShow()} className="mt-2 mt-md-0">
              <FaPlus className="me-2" />Add New Test
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
                  <thead style={{ background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' }} className="text-white">
                    <tr>
                      <th>ID</th>
                      <th>Test Name</th>
                      <th>Price (₹)</th>
                      <th>Details</th>
                      <th>Rules</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map(test => (
                      <tr key={test.id}>
                        <td>{test.id}</td>
                        <td><strong>{test.name}</strong></td>
                        <td>₹{test.price.toFixed(2)}</td>
                        <td className="text-truncate" style={{ maxWidth: '200px' }}>{test.details}</td>
                        <td className="text-truncate" style={{ maxWidth: '200px' }}>{test.rules}</td>
                        <td className="text-center">
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShow(test)}
                            disabled={loading}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(test.id)}
                            disabled={loading}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTest ? 'Edit Test' : 'Add New Test'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Test Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Test Rules/Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="secondary" type="submit">
              {editingTest ? 'Update' : 'Add'} Test
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Tests
