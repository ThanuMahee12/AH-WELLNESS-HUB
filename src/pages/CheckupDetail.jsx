import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Form } from 'react-bootstrap'
import { FaArrowLeft, FaFilePdf, FaWhatsapp, FaFacebook, FaInstagram, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes } from 'react-icons/fa'
import { selectAllCheckups, updateCheckup } from '../store/checkupsSlice'
import { selectAllPatients } from '../store/patientsSlice'
import { selectAllTests } from '../store/testsSlice'
import bloodLabLogo from '../assets/blood-lab-logo.png'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function CheckupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const billRef = useRef()

  const checkups = useSelector(selectAllCheckups)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)

  const [checkup, setCheckup] = useState(null)
  const [patient, setPatient] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')
  const [editedTestNotes, setEditedTestNotes] = useState({})

  useEffect(() => {
    const foundCheckup = checkups.find(c => c.id === id)
    setCheckup(foundCheckup)

    if (foundCheckup) {
      const foundPatient = patients.find(p => p.id === foundCheckup.patientId)
      setPatient(foundPatient)

      // Initialize edit states
      setEditedNotes(foundCheckup.notes || '')
      const testNotesMap = {}
      foundCheckup.tests.forEach(testItem => {
        testNotesMap[testItem.testId] = testItem.notes || ''
      })
      setEditedTestNotes(testNotesMap)
    }
  }, [id, checkups, patients])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset to original values
    setEditedNotes(checkup.notes || '')
    const testNotesMap = {}
    checkup.tests.forEach(testItem => {
      testNotesMap[testItem.testId] = testItem.notes || ''
    })
    setEditedTestNotes(testNotesMap)
  }

  const handleSave = async () => {
    try {
      // Update the tests array with new notes
      const updatedTests = checkup.tests.map(testItem => ({
        ...testItem,
        notes: editedTestNotes[testItem.testId] || ''
      }))

      // Dispatch update action
      await dispatch(updateCheckup({
        id: checkup.id,
        notes: editedNotes,
        tests: updatedTests
      })).unwrap()

      setIsEditing(false)
      alert('Checkup updated successfully!')
    } catch (error) {
      console.error('Error updating checkup:', error)
      alert('Failed to update checkup')
    }
  }

  const handleTestNoteChange = (testId, value) => {
    setEditedTestNotes(prev => ({
      ...prev,
      [testId]: value
    }))
  }

  const handleGeneratePDF = async () => {
    if (!billRef.current) return

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`Bill_${checkup.id}_${patient?.name.replace(/\s+/g, '_')}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!checkup || !patient) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Checkup not found</h4>
            <Button
              onClick={() => navigate('/checkups')}
              style={{
                backgroundColor: '#06B6D4',
                border: 'none',
                color: 'white'
              }}
            >
              <FaArrowLeft className="me-2" />
              Back to Checkups
            </Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  return (
    <Container fluid className="p-3 p-md-4">
      {/* Action Buttons */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              onClick={() => navigate('/checkups')}
              size="sm"
              style={{
                backgroundColor: 'transparent',
                border: '2px solid #0891B2',
                color: '#0891B2'
              }}
            >
              <FaArrowLeft className="me-2" />
              Back to Checkups
            </Button>
            {!isEditing ? (
              <>
                <Button
                  onClick={handleEdit}
                  size="sm"
                  style={{
                    backgroundColor: '#06B6D4',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <FaEdit className="me-2" />
                  Edit Notes
                </Button>
                <Button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                  size="sm"
                  style={{
                    backgroundColor: '#0891B2',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <FaFilePdf className="me-2" />
                  {isGenerating ? 'Generating PDF...' : 'Download as PDF'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  size="sm"
                  style={{
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <FaSave className="me-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="secondary"
                >
                  <FaTimes className="me-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </Col>
      </Row>

      {/* Bill Preview */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body ref={billRef} style={{ padding: '2rem', backgroundColor: 'white' }}>
              {/* Header */}
              <div className="text-center mb-4 pb-3" style={{ borderBottom: '3px solid #0891B2' }}>
                <img
                  src={bloodLabLogo}
                  alt="Logo"
                  style={{ height: '80px', marginBottom: '1rem' }}
                />
                <h3 style={{ color: '#0891B2', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  AH WELLNESS HUB & ASIRI LABORATORIES
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 0 }}>
                  Complete Health Care Solutions
                </p>
              </div>

              {/* Bill Info */}
              <Row className="mb-4">
                <Col md={6}>
                  <h5 style={{ color: '#0891B2', marginBottom: '1rem' }}>Bill Information</h5>
                  <p className="mb-1"><strong>Bill ID:</strong> #{checkup.id}</p>
                  <p className="mb-1"><strong>Date:</strong> {new Date(checkup.timestamp).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Time:</strong> {new Date(checkup.timestamp).toLocaleTimeString()}</p>
                </Col>
                <Col md={6}>
                  <h5 style={{ color: '#0891B2', marginBottom: '1rem' }}>Patient Information</h5>
                  <p className="mb-1"><strong>Name:</strong> {patient.name}</p>
                  <p className="mb-1"><strong>Age:</strong> {patient.age} years</p>
                  <p className="mb-1"><strong>Gender:</strong> {patient.gender}</p>
                  <p className="mb-1"><strong>Mobile:</strong> {patient.mobile}</p>
                  <p className="mb-1">
                    <strong>Weight:</strong> {checkup.weight && checkup.weight !== '0' ? `${checkup.weight} kg` : 'N/A'}
                  </p>
                  <p className="mb-1">
                    <strong>Height:</strong> {checkup.height && checkup.height !== '0' ? `${checkup.height} cm` : 'N/A'}
                  </p>
                </Col>
              </Row>

              {/* Tests Table */}
              <div className="mb-4">
                <h5 style={{ color: '#0891B2', marginBottom: '1rem' }}>Tests Performed</h5>
                <Table bordered style={{ marginBottom: '0' }}>
                  <thead style={{ backgroundColor: '#e0f2fe' }}>
                    <tr>
                      <th style={{ width: '40%', color: '#0891B2' }}>Test Name</th>
                      <th style={{ width: '20%', color: '#0891B2', textAlign: 'right' }}>Price (Rs.)</th>
                      <th style={{ width: '40%', color: '#0891B2' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkup.tests.map((testItem) => {
                      const test = tests.find(t => t.id === testItem.testId)
                      return test ? (
                        <tr key={testItem.testId}>
                          <td>{test.name}</td>
                          <td style={{ textAlign: 'right' }}>Rs. {test.price.toFixed(2)}</td>
                          <td>
                            {isEditing ? (
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={editedTestNotes[testItem.testId] || ''}
                                onChange={(e) => handleTestNoteChange(testItem.testId, e.target.value)}
                                placeholder="Add notes for this test..."
                                style={{ fontSize: '0.9rem' }}
                              />
                            ) : (
                              <span style={{ fontSize: '0.9rem', color: testItem.notes ? '#475569' : '#94a3b8' }}>
                                {testItem.notes || 'No notes'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ) : null
                    })}
                    <tr style={{ backgroundColor: '#0891B2', color: 'white', fontWeight: 'bold' }}>
                      <td colSpan="2">Total Amount</td>
                      <td style={{ textAlign: 'right' }}>Rs. {checkup.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* General Notes */}
              <div className="mb-4">
                <h5 style={{ color: '#0891B2', marginBottom: '0.5rem' }}>General Notes</h5>
                {isEditing ? (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add general notes for this checkup..."
                    style={{ fontSize: '0.9rem' }}
                  />
                ) : (
                  <p style={{ fontSize: '0.9rem', color: checkup.notes ? '#475569' : '#94a3b8' }}>
                    {checkup.notes || 'No general notes'}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4" style={{ borderTop: '2px solid #e2e8f0' }}>
                <Row>
                  <Col md={6}>
                    <h6 style={{ color: '#0891B2', marginBottom: '0.75rem' }}>Contact Us</h6>
                    <p className="mb-1" style={{ fontSize: '0.85rem' }}>
                      <FaPhone className="me-2" style={{ color: '#0891B2' }} />
                      <strong>Mobile:</strong> +94 72 338 8793
                    </p>
                    <p className="mb-1" style={{ fontSize: '0.85rem' }}>
                      <FaWhatsapp className="me-2" style={{ color: '#0891B2' }} />
                      <strong>WhatsApp:</strong> +94 72 338 8793
                    </p>
                    <p className="mb-1" style={{ fontSize: '0.85rem' }}>
                      <FaEnvelope className="me-2" style={{ color: '#0891B2' }} />
                      <strong>Email:</strong> vijayjena@yahoo.com
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6 style={{ color: '#0891B2', marginBottom: '0.75rem' }}>Follow Us</h6>
                    <p className="mb-1" style={{ fontSize: '0.85rem' }}>
                      <FaInstagram className="me-2" style={{ color: '#0891B2' }} />
                      <strong>Instagram:</strong> wijayjena2
                    </p>
                    <p className="mb-1" style={{ fontSize: '0.85rem' }}>
                      <FaFacebook className="me-2" style={{ color: '#0891B2' }} />
                      <strong>Facebook:</strong> drwjanakan
                    </p>
                  </Col>
                </Row>
                <div className="text-center mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 0 }}>
                    Thank you for choosing AH Wellness Hub & Asiri Laboratories
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default CheckupDetail
