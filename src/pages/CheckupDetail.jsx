import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Form, Collapse, Tabs, Tab } from 'react-bootstrap'
import { FaArrowLeft, FaFilePdf, FaPrint, FaWhatsapp, FaFacebook, FaInstagram, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes, FaCog, FaStickyNote, FaPrescriptionBottleAlt, FaPlus, FaTrash } from 'react-icons/fa'
import Select from 'react-select'
import { selectAllCheckups, updateCheckup } from '../store/checkupsSlice'
import { selectAllPatients } from '../store/patientsSlice'
import { selectAllTests } from '../store/testsSlice'
import { selectAllMedicines, fetchMedicines } from '../store/medicinesSlice'
import { RichTextEditor } from '../components/ui'
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
  const medicines = useSelector(selectAllMedicines)

  const [checkup, setCheckup] = useState(null)
  const [patient, setPatient] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')
  const [editedTestNotes, setEditedTestNotes] = useState({})
  const [editedCommonNotes, setEditedCommonNotes] = useState('')
  const [editedPrescription, setEditedPrescription] = useState('')
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const [showPdfSettings, setShowPdfSettings] = useState(false)
  const [showPrescriptionPdfSettings, setShowPrescriptionPdfSettings] = useState(false)
  const [pdfSettings, setPdfSettings] = useState({
    format: 'a4',
    width: 210,
    height: 297,
    orientation: 'portrait'
  })
  const [prescriptionPdfSettings, setPrescriptionPdfSettings] = useState({
    format: 'a4',
    width: 210,
    height: 297,
    orientation: 'portrait'
  })
  const prescriptionRef = useRef()

  useEffect(() => {
    // Fetch medicines when component mounts
    dispatch(fetchMedicines())
  }, [dispatch])

  useEffect(() => {
    const foundCheckup = checkups.find(c => c.id === id)
    setCheckup(foundCheckup)

    if (foundCheckup) {
      const foundPatient = patients.find(p => p.id === foundCheckup.patientId)
      setPatient(foundPatient)

      // Initialize edit states
      setEditedNotes(foundCheckup.notes || '')
      setEditedCommonNotes(foundCheckup.commonNotes || '')
      setEditedPrescription(foundCheckup.prescription || '')
      setPrescriptionMedicines(foundCheckup.prescriptionMedicines || [])
      setPrescriptionNotes(foundCheckup.prescriptionNotes || '')
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
    setEditedCommonNotes(checkup.commonNotes || '')
    setEditedPrescription(checkup.prescription || '')
    setPrescriptionMedicines(checkup.prescriptionMedicines || [])
    setPrescriptionNotes(checkup.prescriptionNotes || '')
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
        commonNotes: editedCommonNotes,
        prescription: editedPrescription,
        prescriptionMedicines: prescriptionMedicines,
        prescriptionNotes: prescriptionNotes,
        tests: updatedTests
      })).unwrap()

      setIsEditing(false)
      alert('Checkup updated successfully!')
    } catch (error) {
      console.error('Error updating checkup:', error)
      alert('Failed to update checkup')
    }
  }

  const handleAddMedicine = () => {
    setPrescriptionMedicines([...prescriptionMedicines, {
      medicineId: '',
      quantity: '',
      instructions: ''
    }])
  }

  const handleRemoveMedicine = (index) => {
    setPrescriptionMedicines(prescriptionMedicines.filter((_, i) => i !== index))
  }

  const handleMedicineChange = (index, field, value) => {
    const updated = [...prescriptionMedicines]
    updated[index] = { ...updated[index], [field]: value }
    setPrescriptionMedicines(updated)
  }

  const handlePrescriptionFormatChange = (format) => {
    const presets = {
      a4: { width: 210, height: 297, orientation: 'portrait' },
      a5: { width: 148, height: 210, orientation: 'portrait' },
      letter: { width: 215.9, height: 279.4, orientation: 'portrait' },
      custom: { width: prescriptionPdfSettings.width, height: prescriptionPdfSettings.height, orientation: prescriptionPdfSettings.orientation }
    }

    setPrescriptionPdfSettings({
      format,
      ...presets[format]
    })
  }

  const handlePrintPrescription = () => {
    if (prescriptionRef.current) {
      prescriptionRef.current.classList.add('printing')
    }
    window.print()
    setTimeout(() => {
      if (prescriptionRef.current) {
        prescriptionRef.current.classList.remove('printing')
      }
    }, 100)
  }

  const handleGeneratePrescriptionPDF = async () => {
    if (!prescriptionRef.current) return

    setIsGenerating(true)

    try {
      const prescriptionClone = prescriptionRef.current.cloneNode(true)
      prescriptionClone.style.position = 'absolute'
      prescriptionClone.style.left = '-9999px'
      prescriptionClone.style.top = '0'
      prescriptionClone.style.width = '210mm'
      prescriptionClone.style.padding = '25px'
      prescriptionClone.style.backgroundColor = '#ffffff'
      document.body.appendChild(prescriptionClone)

      const canvas = await html2canvas(prescriptionClone, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123
      })

      document.body.removeChild(prescriptionClone)

      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({
        orientation: prescriptionPdfSettings.orientation,
        unit: 'mm',
        format: prescriptionPdfSettings.format === 'custom' ? [prescriptionPdfSettings.width, prescriptionPdfSettings.height] : prescriptionPdfSettings.format
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgScaledWidth = imgWidth * ratio
      const imgScaledHeight = imgHeight * ratio

      const marginX = (pdfWidth - imgScaledWidth) / 2
      const marginY = 5

      pdf.addImage(imgData, 'PNG', marginX, marginY, imgScaledWidth, imgScaledHeight)
      pdf.save(`Prescription_${checkup.id}_${patient?.name.replace(/\s+/g, '_')}.pdf`)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Error: ' + error.message)
    } finally {
      setIsGenerating(false)
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
                  {activeTab === 'details' ? 'Edit Invoice' : activeTab === 'notes' ? 'Edit Notes' : 'Edit Prescription'}
                </Button>
                {activeTab === 'details' && (
                  <>
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
                      {isGenerating ? 'Generating PDF...' : 'Download PDF'}
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
                )}
                {activeTab === 'prescription' && (
                  <>
                    <Button
                      onClick={handlePrintPrescription}
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
                      onClick={handleGeneratePrescriptionPDF}
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
                      {isGenerating ? 'Generating...' : 'Download PDF'}
                    </Button>
                    <Button
                      onClick={() => setShowPrescriptionPdfSettings(!showPrescriptionPdfSettings)}
                      size="sm"
                      variant="outline-secondary"
                      className="no-print"
                    >
                      <FaCog className="me-2" />
                      Settings
                    </Button>
                  </>
                )}
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

      {/* Tabbed Interface */}
      <Row>
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3 no-print"
            style={{ borderBottom: '2px solid #0891B2' }}
          >
            <Tab
              eventKey="details"
              title={
                <span>
                  <FaFilePdf className="me-2" />
                  Invoice
                </span>
              }
            >
              {/* Invoice Tab Content */}
            </Tab>
            <Tab
              eventKey="notes"
              title={
                <span>
                  <FaStickyNote className="me-2" />
                  Notes
                </span>
              }
            >
              {/* Notes Tab Content */}
            </Tab>
            <Tab
              eventKey="prescription"
              title={
                <span>
                  <FaPrescriptionBottleAlt className="me-2" />
                  Prescription
                </span>
              }
            >
              {/* Prescription Tab Content */}
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Bill Preview */}
      {activeTab === 'details' && (
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
                          <td style={{ padding: '0.4rem 0.6rem' }}>
                            <strong style={{ color: '#0891B2' }}>{test.code}</strong> - {test.name}
                          </td>
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
                          <strong>{test.code}</strong> - <strong>{test.name}</strong>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
                            (Rs. {test.price?.toFixed(2)})
                          </span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editedTestNotes[testItem.testId] || ''}
                          onChange={(e) => handleTestNoteChange(testItem.testId, e.target.value)}
                          placeholder={`Internal notes for ${test.code} - ${test.name}...`}
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
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 style={{ color: '#0891B2', marginBottom: '1.5rem' }}>
                  <FaStickyNote className="me-2" />
                  Checkup Notes
                </h5>

                {/* Test-Related Notes */}
                <div className="mb-4">
                  <h6 style={{ color: '#0891B2', borderBottom: '2px solid #e0f2fe', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    Test-Related Notes
                  </h6>
                  {checkup.tests.map((testItem) => {
                    const test = tests.find(t => t.id === testItem.testId)
                    return test ? (
                      <div key={testItem.testId} className="mb-3" style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.375rem', borderLeft: '4px solid #0891B2' }}>
                        <div className="mb-2">
                          <strong style={{ color: '#0891B2', fontSize: '1rem' }}>{test.code}</strong>
                          <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>- {test.name}</span>
                          <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.85rem' }}>(Rs. {test.price?.toFixed(2)})</span>
                        </div>
                        {isEditing ? (
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={editedTestNotes[testItem.testId] || ''}
                            onChange={(e) => handleTestNoteChange(testItem.testId, e.target.value)}
                            placeholder={`Add notes for ${test.name}...`}
                            style={{ fontSize: '0.9rem' }}
                          />
                        ) : (
                          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                            {testItem.notes || <em style={{ color: '#94a3b8' }}>No notes added for this test</em>}
                          </p>
                        )}
                      </div>
                    ) : null
                  })}
                </div>

                {/* Common Notes */}
                <div className="mb-3">
                  <h6 style={{ color: '#0891B2', borderBottom: '2px solid #e0f2fe', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    Common Notes
                  </h6>
                  {isEditing ? (
                    <RichTextEditor
                      label=""
                      value={editedCommonNotes}
                      onChange={(value) => setEditedCommonNotes(value)}
                      placeholder="Add common notes for this checkup..."
                      height="250px"
                    />
                  ) : (
                    <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', minHeight: '100px' }}>
                      {checkup.commonNotes ? (
                        <div dangerouslySetInnerHTML={{ __html: checkup.commonNotes }} />
                      ) : (
                        <em style={{ color: '#94a3b8' }}>No common notes added</em>
                      )}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="d-flex gap-2 justify-content-end mt-3">
                    <Button
                      onClick={handleSave}
                      style={{
                        backgroundColor: '#10b981',
                        border: 'none',
                        color: 'white'
                      }}
                    >
                      <FaSave className="me-2" />
                      Save Notes
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="secondary"
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Prescription Tab */}
      {activeTab === 'prescription' && (
        <>
          {/* PDF Settings */}
          <Collapse in={showPrescriptionPdfSettings}>
            <Row className="mb-3 no-print">
              <Col>
                <Card style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Card.Body className="py-2">
                    <Row className="align-items-center">
                      <Col md={4}>
                        <Form.Group className="mb-0">
                          <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Paper Size</Form.Label>
                          <Form.Select
                            size="sm"
                            value={prescriptionPdfSettings.format}
                            onChange={(e) => handlePrescriptionFormatChange(e.target.value)}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <option value="a4">A4 (210 x 297 mm)</option>
                            <option value="a5">A5 (148 x 210 mm)</option>
                            <option value="letter">Letter (8.5 x 11 in)</option>
                            <option value="custom">Custom Size</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      {prescriptionPdfSettings.format === 'custom' && (
                        <>
                          <Col md={2}>
                            <Form.Group className="mb-0">
                              <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Width (mm)</Form.Label>
                              <Form.Control
                                type="number"
                                size="sm"
                                value={prescriptionPdfSettings.width}
                                onChange={(e) => setPrescriptionPdfSettings({...prescriptionPdfSettings, width: parseFloat(e.target.value)})}
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
                                value={prescriptionPdfSettings.height}
                                onChange={(e) => setPrescriptionPdfSettings({...prescriptionPdfSettings, height: parseFloat(e.target.value)})}
                                style={{ fontSize: '0.85rem' }}
                              />
                            </Form.Group>
                          </Col>
                        </>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Collapse>

          {/* Medicine Selection Section - Only visible when editing */}
          {isEditing && (
            <Row className="mb-3 no-print">
              <Col>
                <Card style={{ backgroundColor: '#f8fafc', border: '1px solid #e0f2fe' }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 style={{ color: '#0891B2', marginBottom: 0 }}>Add Medicines to Prescription</h6>
                      <Button
                        size="sm"
                        onClick={handleAddMedicine}
                        style={{ backgroundColor: '#10b981', border: 'none' }}
                      >
                        <FaPlus className="me-1" />
                        Add Medicine
                      </Button>
                    </div>

                    {prescriptionMedicines.map((med, index) => {
                      const selectedMedicine = medicines.find(m => m.id === med.medicineId)
                      return (
                        <Card key={index} className="mb-2 prescription-form-card" style={{ border: '1px solid #cbd5e1' }}>
                          <Card.Body className="p-3">
                            <Row>
                              <Col md={5}>
                                <Form.Group className="mb-2">
                                  <Form.Label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Medicine (Name - Dosage - Brand)</Form.Label>
                                  <Select
                                    value={selectedMedicine ? {
                                      value: selectedMedicine.id,
                                      label: `${selectedMedicine.name} - ${selectedMedicine.dosage} - ${selectedMedicine.brand}`
                                    } : null}
                                    onChange={(option) => handleMedicineChange(index, 'medicineId', option.value)}
                                    options={medicines.map(m => ({
                                      value: m.id,
                                      label: `${m.name} - ${m.dosage} - ${m.brand}`
                                    }))}
                                    placeholder="Select medicine with dosage..."
                                    styles={{
                                      control: (base) => ({ ...base, fontSize: '0.9rem' }),
                                      menu: (base) => ({ ...base, fontSize: '0.9rem' })
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={2}>
                                <Form.Group className="mb-2">
                                  <Form.Label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Quantity</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="text"
                                    value={med.quantity}
                                    onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)}
                                    placeholder="e.g., 10"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group className="mb-2">
                                  <Form.Label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Instructions</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="text"
                                    value={med.instructions}
                                    onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                    placeholder="e.g., After meals, Twice daily"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={1} className="d-flex align-items-end">
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleRemoveMedicine(index)}
                                  style={{ marginBottom: '0.5rem' }}
                                >
                                  <FaTrash />
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      )
                    })}

                    <Form.Group className="mt-3">
                      <Form.Label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0891B2' }}>Additional Instructions / Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={prescriptionNotes}
                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                        placeholder="Add general instructions or notes for the prescription..."
                        style={{ fontSize: '0.9rem' }}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Live Prescription Preview */}
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Body ref={prescriptionRef} className="prescription-preview" style={{ padding: '2.5rem', backgroundColor: 'white' }}>
                  {/* Header */}
                  <div className="mb-3 pb-2 prescription-header" style={{ borderBottom: '2px solid #0891B2' }}>
                    <Row className="align-items-center">
                      <Col xs={3} className="text-start">
                        <img src={bloodLabLogo} alt="AWH Logo" style={{ height: '60px', objectFit: 'contain' }} />
                      </Col>
                      <Col xs={6} className="text-center">
                        <h4 style={{ color: '#0891B2', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                          AH WELLNESS HUB & ASIRI LABORATORIES
                        </h4>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 0 }}>
                          Medical Prescription
                        </p>
                      </Col>
                      <Col xs={3} className="text-end">
                        <div style={{ fontSize: '0.75rem' }}>
                          <p className="mb-0"><strong>Date:</strong> {new Date(checkup.timestamp).toLocaleDateString()}</p>
                          <p className="mb-0"><strong>Rx #:</strong> {checkup.id}</p>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Patient Info */}
                  <div className="mb-3" style={{ fontSize: '0.85rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem' }}>
                    <Row>
                      <Col xs={6}>
                        <strong>Patient:</strong> {patient.name}
                      </Col>
                      <Col xs={3}>
                        <strong>Age:</strong> {patient.age} years
                      </Col>
                      <Col xs={3}>
                        <strong>Gender:</strong> {patient.gender}
                      </Col>
                    </Row>
                  </div>

                  {/* Medicines Table */}
                  {prescriptionMedicines.length > 0 && (
                    <div className="mb-3">
                      <h6 style={{ color: '#0891B2', marginBottom: '0.75rem', fontSize: '0.95rem' }}>℞ Prescribed Medications</h6>
                      <Table bordered className="prescription-table" style={{ marginBottom: '0', fontSize: '0.85rem' }}>
                        <thead style={{ backgroundColor: '#e0f2fe' }}>
                          <tr>
                            <th style={{ color: '#0891B2', padding: '0.5rem' }}>Medicine (Brand)</th>
                            <th style={{ color: '#0891B2', padding: '0.5rem', width: '15%' }}>Dosage</th>
                            <th style={{ color: '#0891B2', padding: '0.5rem', width: '15%' }}>Quantity</th>
                            <th style={{ color: '#0891B2', padding: '0.5rem', width: '25%' }}>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptionMedicines.map((med, index) => {
                            const medicine = medicines.find(m => m.id === med.medicineId)
                            return medicine ? (
                              <tr key={index}>
                                <td style={{ padding: '0.5rem' }}>
                                  <strong>{medicine.name}</strong>
                                  <br />
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{medicine.brand}</span>
                                </td>
                                <td style={{ padding: '0.5rem', fontWeight: '600', color: '#059669' }}>{medicine.dosage || '-'}</td>
                                <td style={{ padding: '0.5rem' }}>{med.quantity ? `${med.quantity} ${medicine.unit}` : '-'}</td>
                                <td style={{ padding: '0.5rem' }}>{med.instructions || '-'}</td>
                              </tr>
                            ) : null
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {prescriptionNotes && (
                    <div className="mb-3">
                      <h6 style={{ color: '#0891B2', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Instructions</h6>
                      <p style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                        {prescriptionNotes}
                      </p>
                    </div>
                  )}

                  {/* Empty State */}
                  {prescriptionMedicines.length === 0 && !prescriptionNotes && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <FaPrescriptionBottleAlt size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                      <p style={{ fontSize: '0.9rem' }}>
                        <em>No prescription added yet. Click "Edit Notes" to add medicines and instructions.</em>
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid #e2e8f0', fontSize: '0.7rem' }}>
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
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ borderTop: '1px solid #64748b', width: '150px', marginLeft: 'auto', marginBottom: '0.25rem' }} />
                          <p style={{ fontSize: '0.75rem', marginBottom: 0 }}>Doctor's Signature</p>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>

              {/* Save/Cancel Buttons */}
              {isEditing && (
                <div className="d-flex gap-2 justify-content-end mt-3">
                  <Button
                    onClick={handleSave}
                    style={{ backgroundColor: '#10b981', border: 'none' }}
                  >
                    <FaSave className="me-2" />
                    Save Prescription
                  </Button>
                  <Button onClick={handleCancel} variant="secondary">
                    <FaTimes className="me-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </Col>
          </Row>

          {/* Responsive Styles for Prescription */}
          <style>{`
            @media (max-width: 767px) {
              .prescription-form-card {
                padding: 0.5rem !important;
              }

              .prescription-form-card .row {
                margin: 0 !important;
              }

              .prescription-form-card .col-md-5,
              .prescription-form-card .col-md-2,
              .prescription-form-card .col-md-4,
              .prescription-form-card .col-md-1 {
                padding: 0.25rem !important;
                margin-bottom: 0.5rem;
              }

              .prescription-table {
                font-size: 0.75rem !important;
              }

              .prescription-table th,
              .prescription-table td {
                padding: 0.3rem !important;
              }

              .prescription-preview {
                padding: 1rem !important;
              }

              .prescription-header h4 {
                font-size: 0.9rem !important;
              }

              .prescription-header img {
                height: 40px !important;
              }
            }

            @media (min-width: 768px) and (max-width: 991px) {
              .prescription-form-card {
                padding: 0.75rem !important;
              }

              .prescription-table {
                font-size: 0.8rem !important;
              }
            }
          `}</style>
        </>
      )}
    </Container>
  )
}

export default CheckupDetail
