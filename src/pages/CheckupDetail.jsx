import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Form, Collapse } from 'react-bootstrap'
import { FaArrowLeft, FaFilePdf, FaPrint, FaWhatsapp, FaFacebook, FaInstagram, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes, FaCog } from 'react-icons/fa'
import { selectAllCheckups, updateCheckup } from '../store/checkupsSlice'
import { selectAllPatients } from '../store/patientsSlice'
import { selectAllTests } from '../store/testsSlice'
import bloodLabLogo from '../assets/blood-lab-logo.png'
import asiriLogo from '../assets/asiri-logo.png'
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
  const [showPdfSettings, setShowPdfSettings] = useState(false)
  const [pdfSettings, setPdfSettings] = useState({
    format: 'a4',
    width: 210,
    height: 297,
    orientation: 'portrait'
  })

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

  const handleFormatChange = (format) => {
    const presets = {
      a4: { width: 210, height: 297, orientation: 'portrait' },
      a5: { width: 148, height: 210, orientation: 'portrait' },
      letter: { width: 215.9, height: 279.4, orientation: 'portrait' },
      thermal80: { width: 80, height: 200, orientation: 'portrait' },
      thermal58: { width: 58, height: 150, orientation: 'portrait' },
      custom: { width: pdfSettings.width, height: pdfSettings.height, orientation: pdfSettings.orientation }
    }

    setPdfSettings({
      format,
      ...presets[format]
    })
  }

  const handlePrint = () => {
    // Add print class to adjust layout
    if (billRef.current) {
      billRef.current.classList.add('printing')
    }

    // Trigger browser print dialog
    window.print()

    // Remove print class after printing
    setTimeout(() => {
      if (billRef.current) {
        billRef.current.classList.remove('printing')
      }
    }, 100)
  }

  const handleGeneratePDF = async () => {
    if (!billRef.current) return

    setIsGenerating(true)

    try {
      // Clone the bill content to avoid modifying the original
      const billClone = billRef.current.cloneNode(true)
      billClone.style.position = 'absolute'
      billClone.style.left = '-9999px'
      billClone.style.top = '0'
      billClone.style.width = '210mm' // A4 width
      billClone.style.padding = '25px' // Increased padding for better PDF layout
      billClone.style.backgroundColor = '#ffffff'
      document.body.appendChild(billClone)

      // Generate canvas from the clone
      const canvas = await html2canvas(billClone, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123 // A4 height in pixels at 96 DPI
      })

      // Remove the clone
      document.body.removeChild(billClone)

      const imgData = canvas.toDataURL('image/png')

      // Create PDF with selected dimensions
      const pdf = new jsPDF({
        orientation: pdfSettings.orientation,
        unit: 'mm',
        format: pdfSettings.format === 'custom' ? [pdfSettings.width, pdfSettings.height] : pdfSettings.format
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Calculate dimensions to fit content properly
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgScaledWidth = imgWidth * ratio
      const imgScaledHeight = imgHeight * ratio

      // Center the content
      const marginX = (pdfWidth - imgScaledWidth) / 2
      const marginY = 5

      pdf.addImage(imgData, 'PNG', marginX, marginY, imgScaledWidth, imgScaledHeight)
      pdf.save(`Bill_${checkup.id}_${patient?.name.replace(/\s+/g, '_')}.pdf`)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Error: ' + error.message)
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
      <Row className="mb-3 no-print">
        <Col>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <Button
              onClick={() => navigate('/checkups')}
              size="sm"
              style={{
                backgroundColor: 'transparent',
                border: '2px solid #0891B2',
                color: '#0891B2'
              }}
              className="no-print"
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
                  className="no-print"
                >
                  <FaEdit className="me-2" />
                  Edit Notes
                </Button>
                <Button
                  onClick={handlePrint}
                  size="sm"
                  style={{
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: 'white'
                  }}
                  className="no-print"
                >
                  <FaPrint className="me-2" />
                  Print
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
                  className="no-print"
                >
                  <FaFilePdf className="me-2" />
                  {isGenerating ? 'Generating PDF...' : 'Download as PDF'}
                </Button>
                <Button
                  onClick={() => setShowPdfSettings(!showPdfSettings)}
                  size="sm"
                  variant="outline-secondary"
                  className="no-print"
                >
                  <FaCog className="me-2" />
                  Settings
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
                  className="no-print"
                >
                  <FaSave className="me-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="secondary"
                  className="no-print"
                >
                  <FaTimes className="me-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </Col>
      </Row>

      {/* PDF Settings Panel */}
      <Collapse in={showPdfSettings}>
        <Row className="mb-3 no-print">
          <Col>
            <Card style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Card.Body className="py-2">
                <Row className="align-items-center">
                  <Col md={3}>
                    <Form.Group className="mb-0">
                      <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Paper Size</Form.Label>
                      <Form.Select
                        size="sm"
                        value={pdfSettings.format}
                        onChange={(e) => handleFormatChange(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <option value="a4">A4 (210 x 297 mm)</option>
                        <option value="a5">A5 (148 x 210 mm)</option>
                        <option value="letter">Letter (8.5 x 11 in)</option>
                        <option value="thermal80">Thermal 80mm</option>
                        <option value="thermal58">Thermal 58mm</option>
                        <option value="custom">Custom Size</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {pdfSettings.format === 'custom' && (
                    <>
                      <Col md={2}>
                        <Form.Group className="mb-0">
                          <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Width (mm)</Form.Label>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={pdfSettings.width}
                            onChange={(e) => setPdfSettings({...pdfSettings, width: parseFloat(e.target.value)})}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group className="mb-0">
                          <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Height (mm)</Form.Label>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={pdfSettings.height}
                            onChange={(e) => setPdfSettings({...pdfSettings, height: parseFloat(e.target.value)})}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group className="mb-0">
                          <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Orientation</Form.Label>
                          <Form.Select
                            size="sm"
                            value={pdfSettings.orientation}
                            onChange={(e) => setPdfSettings({...pdfSettings, orientation: e.target.value})}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </>
                  )}
                  <Col md={pdfSettings.format === 'custom' ? 3 : 9}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1.25rem' }}>
                      <strong>Current:</strong> {pdfSettings.width} x {pdfSettings.height} mm ({pdfSettings.orientation})
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Collapse>

      {/* Bill Preview */}
      <Row>
        <Col>
          <style>{`
            /* Print styles */
            @media print {
              /* Reset page setup */
              @page {
                size: ${pdfSettings.format === 'a4' ? 'A4' :
                       pdfSettings.format === 'a5' ? 'A5' :
                       pdfSettings.format === 'letter' ? 'letter' :
                       `${pdfSettings.width}mm ${pdfSettings.height}mm`};
                margin: 10mm;
              }

              /* Position bill content properly */
              .bill-content {
                position: relative !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 25px !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                page-break-inside: avoid;
              }

              /* Hide card shadows and borders for clean print */
              .card, .shadow-sm {
                box-shadow: none !important;
                border: none !important;
              }

              /* Ensure images print */
              .bill-content img {
                max-width: 100%;
                height: auto;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Prevent extra pages */
              .bill-content .header-section,
              .bill-content .footer-section {
                page-break-inside: avoid;
              }
            }

            /* Dynamic sizing based on paper format */
            .bill-content {
              max-width: 100%;
              box-sizing: border-box;
              overflow: visible;
            }

            .bill-content.printing {
              width: 100%;
              max-width: ${pdfSettings.width}mm;
              height: auto;
              max-height: ${pdfSettings.height}mm;
              padding: ${pdfSettings.width < 100 ? '8px' : '25px'} !important;
              font-size: ${pdfSettings.width < 100 ? '0.65rem' : '0.85rem'} !important;
              overflow: visible;
              page-break-inside: avoid;
            }

            /* Prevent content overflow */
            .bill-content.printing * {
              box-sizing: border-box;
            }

            /* Fix rounded corners and borders */
            .bill-content img {
              display: block;
              max-width: 100%;
              height: auto;
            }

            /* Hide fixed/absolute positioned elements during PDF generation */
            body:has(.printing) *[style*="position: fixed"],
            body:has(.printing) *[style*="position: absolute"]:not(.bill-content *) {
              display: none !important;
              visibility: hidden !important;
            }

            /* Thermal printer adjustments */
            ${pdfSettings.width < 100 ? `
              .bill-content.printing .header-section {
                flex-direction: column !important;
                text-align: center !important;
              }

              .bill-content.printing .header-section img {
                height: 40px !important;
                margin: 0 auto 5px !important;
              }

              .bill-content.printing .header-section h4 {
                font-size: 0.75rem !important;
              }

              .bill-content.printing table {
                font-size: 0.65rem !important;
              }

              .bill-content.printing th,
              .bill-content.printing td {
                padding: 0.2rem 0.3rem !important;
              }

              .bill-content.printing .footer-section {
                font-size: 0.55rem !important;
              }
            ` : ''}
          `}</style>
          <Card className="shadow-sm">
            <Card.Body ref={billRef} className="bill-content" style={{ padding: '2.5rem', backgroundColor: 'white' }}>
              {/* Compact Header */}
              <div className="mb-3 pb-2 header-section" style={{ borderBottom: '2px solid #0891B2' }}>
                <Row className="align-items-center">
                  <Col xs={3} className="text-start">
                    <img
                      src={bloodLabLogo}
                      alt="AWH Logo"
                      style={{ height: '60px', objectFit: 'contain' }}
                    />
                  </Col>
                  <Col xs={6} className="text-center">
                    <h4 style={{ color: '#0891B2', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                      AH WELLNESS HUB & ASIRI LABORATORIES
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 0 }}>
                      Complete Health Care Solutions
                    </p>
                  </Col>
                  <Col xs={3} className="text-end">
                    <div style={{ fontSize: '0.75rem' }}>
                      <p className="mb-0">
                        <strong className="bill-label">Bill #:</strong> {checkup.id}
                      </p>
                      <p className="mb-0">{new Date(checkup.timestamp).toLocaleDateString()}</p>
                      <p className="mb-0">{new Date(checkup.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Compact Patient Info */}
              <div className="mb-3" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                <Row>
                  <Col xs={6}>
                    <strong>Patient:</strong> {patient.name} | <strong>Age:</strong> {patient.age}yr | <strong>Gender:</strong> {patient.gender}
                  </Col>
                  <Col xs={6} className="text-end">
                    <strong>Mobile:</strong> {patient.mobile}
                    {(checkup.weight && checkup.weight !== '0') || (checkup.height && checkup.height !== '0') ? (
                      <span className="ms-3">
                        {checkup.weight && checkup.weight !== '0' && `Wt: ${checkup.weight}kg`}
                        {checkup.weight && checkup.height && checkup.weight !== '0' && checkup.height !== '0' && ' | '}
                        {checkup.height && checkup.height !== '0' && `Ht: ${checkup.height}cm`}
                      </span>
                    ) : null}
                  </Col>
                </Row>
              </div>

              {/* Tests Table */}
              <div className="mb-3">
                <h6 style={{ color: '#0891B2', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Tests Performed</h6>
                <Table bordered style={{ marginBottom: '0', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#e0f2fe' }}>
                    <tr>
                      <th style={{ width: '70%', color: '#0891B2', padding: '0.4rem 0.6rem' }}>Test Name</th>
                      <th style={{ width: '30%', color: '#0891B2', textAlign: 'right', padding: '0.4rem 0.6rem' }}>Price (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkup.tests.map((testItem) => {
                      const test = tests.find(t => t.id === testItem.testId)
                      return test ? (
                        <tr key={testItem.testId}>
                          <td style={{ padding: '0.4rem 0.6rem' }}>{test.name}</td>
                          <td style={{ textAlign: 'right', padding: '0.4rem 0.6rem' }}>Rs. {test.price.toFixed(2)}</td>
                        </tr>
                      ) : null
                    })}
                    <tr style={{ backgroundColor: '#0891B2', color: 'white', fontWeight: 'bold' }}>
                      <td style={{ padding: '0.5rem 0.6rem' }}>Total Amount</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem 0.6rem' }}>Rs. {checkup.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* Individual Test Notes - Only visible when editing */}
              {isEditing && (
                <div className="mb-3" style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.375rem' }}>
                  <h6 style={{ color: '#0891B2', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Edit Individual Test Notes (Not printed)</h6>
                  {checkup.tests.map((testItem, index) => {
                    const test = tests.find(t => t.id === testItem.testId)
                    return test ? (
                      <div key={testItem.testId} className="mb-2">
                        <Form.Label style={{ fontSize: '0.85rem', color: '#0891B2', marginBottom: '0.25rem' }}>
                          <strong>{test.name}</strong>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editedTestNotes[testItem.testId] || ''}
                          onChange={(e) => handleTestNoteChange(testItem.testId, e.target.value)}
                          placeholder={`Internal notes for ${test.name}...`}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    ) : null
                  })}
                </div>
              )}

              {/* General Notes */}
              {(checkup.notes || isEditing) && (
                <div className="mb-3">
                  <h6 style={{ color: '#0891B2', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Notes</h6>
                  {isEditing ? (
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Add general notes for this checkup (will be printed)..."
                      style={{ fontSize: '0.85rem' }}
                    />
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', marginBottom: 0 }}>
                      {checkup.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-3 pt-2 footer-section" style={{ borderTop: '1px solid #e2e8f0', fontSize: '0.7rem' }}>
                <Row>
                  <Col xs={6}>
                    <p className="mb-0">
                      <FaPhone className="me-1" style={{ color: '#0891B2', fontSize: '0.65rem' }} />
                      <strong>Mobile:</strong> +94 72 338 8793
                    </p>
                    <p className="mb-0">
                      <FaEnvelope className="me-1" style={{ color: '#0891B2', fontSize: '0.65rem' }} />
                      <strong>Email:</strong> vijayjena@yahoo.com
                    </p>
                  </Col>
                  <Col xs={6} className="text-end">
                    <p className="mb-0">
                      <FaInstagram className="me-1" style={{ color: '#0891B2', fontSize: '0.65rem' }} />
                      <strong>IG:</strong> wijayjena2
                    </p>
                    <p className="mb-0">
                      <FaFacebook className="me-1" style={{ color: '#0891B2', fontSize: '0.65rem' }} />
                      <strong>FB:</strong> drwjanakan
                    </p>
                  </Col>
                </Row>
                <div className="text-center mt-2 pt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                    <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: 0 }}>
                      Thank you for choosing AH Wellness Hub & Asiri Laboratories
                    </p>
                    <img
                      src={asiriLogo}
                      alt="Powered by ASIRI"
                      style={{ height: '20px', opacity: 0.7, objectFit: 'contain' }}
                      title="Powered by ASIRI Laboratories"
                    />
                  </div>
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
