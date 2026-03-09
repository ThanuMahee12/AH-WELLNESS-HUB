import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button, Tabs, Tab } from 'react-bootstrap'
import { FaFilePdf, FaPrint, FaFacebook, FaInstagram, FaEnvelope, FaPhone, FaPrescriptionBottleAlt } from 'react-icons/fa'
import { Breadcrumb } from '../components/ui'
import { selectAllCheckups, fetchCheckups } from '../store/checkupsSlice'
import { selectAllPatients, fetchPatients } from '../store/patientsSlice'
import { selectAllTests, fetchTests } from '../store/testsSlice'
import { selectAllMedicines, fetchMedicines } from '../store/medicinesSlice'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'
import { useSettings } from '../hooks/useSettings'
import LoadingSpinner from '../components/common/LoadingSpinner'
import bloodLabLogo from '../assets/blood-lab-logo.png'
import asiriLogo from '../assets/asiri-logo.png'
import paidStampImg from '../assets/paid-stamp.png'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function CheckupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const billRef = useRef()
  const prescriptionRef = useRef()

  const checkups = useSelector(selectAllCheckups)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)
  const medicines = useSelector(selectAllMedicines)
  const user = useSelector(state => state.auth.user)
  const { loading: checkupsLoading } = useSelector(state => state.checkups)
  const { loading: patientsLoading } = useSelector(state => state.patients)

  const [checkup, setCheckup] = useState(null)
  const [patient, setPatient] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const { settings, getLabResultFields, getGeneralTestFields } = useSettings()
  const generalTestFields = getGeneralTestFields()
  const labResultFields = getLabResultFields()
  const labResultsShowEmpty = settings?.labResults?.showEmpty || 'hide'

  // PDF settings from Firestore
  const pdfSettings = settings?.checkupPdf?.invoice || { format: 'a5', width: 148, height: 210, orientation: 'portrait' }
  const prescriptionPdfSettings = settings?.checkupPdf?.prescription || { format: 'a5', width: 148, height: 210, orientation: 'portrait' }

  useEffect(() => {
    if (checkups.length === 0) dispatch(fetchCheckups())
    if (patients.length === 0) dispatch(fetchPatients())
    if (tests.length === 0) dispatch(fetchTests())
    dispatch(fetchMedicines())
  }, [dispatch, checkups.length, patients.length])

  useEffect(() => {
    const foundCheckup = checkups.find(c => c.id === id)
    setCheckup(foundCheckup)

    if (foundCheckup) {
      const foundPatient = patients.find(p => p.id === foundCheckup.patientId)
      setPatient(foundPatient)
    }
  }, [id, checkups, patients])

  // Log checkup view activity
  useEffect(() => {
    if (checkup && patient && user) {
      logActivity({
        userId: user.uid,
        username: user.username || user.email,
        userRole: user.role,
        activityType: ACTIVITY_TYPES.CHECKUP_VIEW,
        description: createActivityDescription(ACTIVITY_TYPES.CHECKUP_VIEW, { billNo: checkup.billNo, checkupId: checkup.id }),
        metadata: { checkupId: id, billNo: checkup.billNo, patientName: patient.name }
      })
    }
  }, [checkup?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Single shared template — header (top) + body (middle, fills space) + footer (bottom)
  const renderTemplate = (children) => (
    <div className="template-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div className="mb-2 pb-1 header-section" style={{ borderBottom: '2px solid #0891B2', textAlign: 'center' }}>
        <img src={bloodLabLogo} alt="AWH Logo" className="template-logo-main" style={{ height: 'clamp(35px, 5vw, 50px)', objectFit: 'contain', marginBottom: '0.25rem' }} />
        <h4 className="template-title" style={{ color: '#0891B2', fontWeight: 'bold', marginBottom: '0.15rem', fontSize: 'clamp(0.65rem, 2vw, 0.9rem)' }}>
          AH WELLNESS HUB & ASIRI LABORATORIES
        </h4>
        <p style={{ color: '#64748b', fontSize: 'clamp(0.5rem, 1.5vw, 0.65rem)', marginBottom: '0.15rem' }}>Complete Health Care Solutions</p>
        <div style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.6rem)', color: '#64748b', marginBottom: '0.25rem' }}>
          <span><strong>Bill #:</strong> {checkup.billNo || checkup.id}</span>
          {' | '}
          <span>{new Date(checkup.timestamp).toLocaleDateString()}</span>
          {' | '}
          <span>{new Date(checkup.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <img src={asiriLogo} alt="ASIRI Logo" className="template-logo-asiri" style={{ height: 'clamp(20px, 3vw, 30px)', objectFit: 'contain', opacity: 0.8 }} />
      </div>

      {/* Patient Info */}
      <div className="mb-2 template-patient" style={{ fontSize: 'clamp(0.6rem, 1.8vw, 0.75rem)', lineHeight: '1.5' }}>
        <div className="patient-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0 clamp(0.5rem, 2vw, 1rem)' }}>
          <span><strong>Patient:</strong> {patient.name}</span>
          <span><strong>Age:</strong> {patient.age}yr</span>
          <span><strong>Gender:</strong> {patient.gender}</span>
          <span><strong>Mobile:</strong> {patient.mobile}</span>
        </div>
      </div>

      {/* Body — unique per tab, fills remaining space */}
      <div className="template-body" style={{ flex: '1 1 auto', paddingTop: 'clamp(0.5rem, 1.5vw, 1rem)', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {/* Contact Footer — always at bottom */}
      <div className="mt-auto pt-1 footer-section" style={{ borderTop: '1px solid #e2e8f0', fontSize: 'clamp(0.45rem, 1.3vw, 0.6rem)' }}>
        <div className="footer-contacts" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '0.25rem' }}>
          <div>
            <p className="mb-0">
              <FaPhone className="me-1" style={{ color: '#0891B2', fontSize: 'clamp(0.4rem, 1.2vw, 0.55rem)' }} />
              <strong>Mobile:</strong> +94 72 338 8793
            </p>
            <p className="mb-0">
              <FaEnvelope className="me-1" style={{ color: '#0891B2', fontSize: 'clamp(0.4rem, 1.2vw, 0.55rem)' }} />
              <strong>Email:</strong> vijayjena@yahoo.com
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="mb-0">
              <FaInstagram className="me-1" style={{ color: '#0891B2', fontSize: 'clamp(0.4rem, 1.2vw, 0.55rem)' }} />
              <strong>IG:</strong> wijayjena2
            </p>
            <p className="mb-0">
              <FaFacebook className="me-1" style={{ color: '#0891B2', fontSize: 'clamp(0.4rem, 1.2vw, 0.55rem)' }} />
              <strong>FB:</strong> drwjanakan
            </p>
          </div>
        </div>
        <div className="text-center mt-1 pt-1 footer-thankyou" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '0.15rem' }}>
            <p style={{ fontSize: 'clamp(0.4rem, 1.2vw, 0.55rem)', color: '#94a3b8', marginBottom: 0 }}>
              Thank you for choosing AH Wellness Hub & Asiri Laboratories
            </p>
            <img src={asiriLogo} alt="Powered by ASIRI" className="footer-asiri-logo" style={{ height: 'clamp(10px, 2vw, 15px)', opacity: 0.7, objectFit: 'contain' }} title="Powered by ASIRI Laboratories" />
          </div>
        </div>
      </div>
    </div>
  )

  const handlePrint = () => {
    if (billRef.current) {
      billRef.current.classList.add('printing')
    }
    window.print()
    setTimeout(() => {
      if (billRef.current) {
        billRef.current.classList.remove('printing')
      }
    }, 100)
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

  const handleGeneratePDF = async () => {
    if (!billRef.current) {
      alert('Invoice content not found. Please refresh the page and try again.')
      return
    }

    setIsGenerating(true)

    try {
      const element = billRef.current

      if (!element.offsetParent && element.offsetHeight === 0) {
        throw new Error('Invoice element is not visible')
      }

      // Convert selected page width mm → pixels (96 DPI)
      const pageWidthMm = pdfSettings.width
      const pageWidthPx = Math.round(pageWidthMm * 96 / 25.4)
      const clonePadding = '3% 10%'
      const cloneFontSize = pageWidthMm < 100 ? '0.65rem' : pageWidthMm <= 160 ? '0.75rem' : '0.85rem'

      // Clone the bill content — use a wrapper div to avoid the body:has(.printing) display:none rule
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;overflow:visible;'
      const billClone = element.cloneNode(true)
      billClone.classList.add('printing')
      billClone.style.width = pageWidthMm + 'mm'
      billClone.style.height = pdfSettings.height + 'mm'
      billClone.style.padding = clonePadding
      billClone.style.fontSize = cloneFontSize
      billClone.style.backgroundColor = '#ffffff'
      billClone.style.boxSizing = 'border-box'
      wrapper.appendChild(billClone)
      document.body.appendChild(wrapper)

      // Wait for images to load
      const images = billClone.getElementsByTagName('img')
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = () => {
              console.warn('Image failed to load:', img.src)
              resolve()
            }
            setTimeout(resolve, 3000)
          })
        })
      )

      // Allow layout to settle before capturing
      await new Promise(resolve => setTimeout(resolve, 200))

      const captureHeight = Math.max(billClone.scrollHeight, billClone.offsetHeight)
      const canvas = await html2canvas(billClone, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: Math.max(pageWidthPx, 800),
        width: billClone.scrollWidth,
        height: captureHeight,
      })

      // Remove the wrapper (which contains the clone)
      document.body.removeChild(wrapper)

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to generate canvas from invoice')
      }

      const imgData = canvas.toDataURL('image/png')

      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to convert canvas to image')
      }

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

      // Calculate dimensions to fit content on ONE page with minimal margins
      const marginTop = 5
      const marginBottom = 5
      const availableHeight = pdfHeight - marginTop - marginBottom
      const availableWidth = pdfWidth - 6 // 3mm margin on each side

      // Scale to fit within page bounds
      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight)
      const imgScaledWidth = imgWidth * ratio
      const imgScaledHeight = imgHeight * ratio

      // Center the content horizontally
      const marginX = (pdfWidth - imgScaledWidth) / 2

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', marginX, marginTop, imgScaledWidth, imgScaledHeight)
      pdf.save(`Bill_${checkup.id}_${patient?.name.replace(/\s+/g, '_')}.pdf`)

      // Log PDF generation activity
      if (user) {
        await logActivity({
          userId: user.uid,
          username: user.username || user.email,
          userRole: user.role,
          activityType: ACTIVITY_TYPES.CHECKUP_PDF_INVOICE,
          description: createActivityDescription(ACTIVITY_TYPES.CHECKUP_PDF_INVOICE, {
            billNo: checkup.billNo,
            patientName: patient?.name
          }),
          metadata: {
            checkupId: checkup.id,
            billNo: checkup.billNo,
            patientId: checkup.patientId,
            patientName: patient?.name,
            pdfType: 'invoice',
            format: pdfSettings.format,
            orientation: pdfSettings.orientation
          }
        })
      }

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Failed to generate PDF.\n\nError: ${error.message}\n\nPlease try:\n1. Refreshing the page\n2. Using the Print button instead\n3. Taking a screenshot of the invoice`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGeneratePrescriptionPDF = async () => {
    if (!prescriptionRef.current) {
      alert('Prescription content not found. Please refresh the page and try again.')
      return
    }

    setIsGenerating(true)

    try {
      const element = prescriptionRef.current
      if (!element.offsetParent && element.offsetHeight === 0) {
        throw new Error('Prescription element is not visible')
      }

      // Convert selected page width mm → pixels (96 DPI)
      const rxPageWidthMm = prescriptionPdfSettings.width
      const rxPageWidthPx = Math.round(rxPageWidthMm * 96 / 25.4)
      const rxPadding = '3% 10%'
      const rxFontSize = rxPageWidthMm < 100 ? '0.65rem' : rxPageWidthMm <= 160 ? '0.75rem' : '0.85rem'

      // Use wrapper to avoid body:has(.printing) display:none rule on the clone
      const rxWrapper = document.createElement('div')
      rxWrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;overflow:visible;'
      const prescriptionClone = element.cloneNode(true)
      prescriptionClone.classList.add('printing')
      prescriptionClone.style.width = rxPageWidthMm + 'mm'
      prescriptionClone.style.height = prescriptionPdfSettings.height + 'mm'
      prescriptionClone.style.padding = rxPadding
      prescriptionClone.style.fontSize = rxFontSize
      prescriptionClone.style.backgroundColor = '#ffffff'
      prescriptionClone.style.boxSizing = 'border-box'
      rxWrapper.appendChild(prescriptionClone)
      document.body.appendChild(rxWrapper)

      // Wait for images to load
      const images = prescriptionClone.getElementsByTagName('img')
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = () => {
              console.warn('Image failed to load:', img.src)
              resolve()
            }
            setTimeout(resolve, 3000)
          })
        })
      )

      // Allow layout to settle before capturing
      await new Promise(resolve => setTimeout(resolve, 200))

      // windowWidth >= 800 to avoid mobile media queries
      const rxCaptureHeight = Math.max(prescriptionClone.scrollHeight, prescriptionClone.offsetHeight)
      const canvas = await html2canvas(prescriptionClone, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: Math.max(rxPageWidthPx, 800),
        width: prescriptionClone.scrollWidth,
        height: rxCaptureHeight,
      })

      document.body.removeChild(rxWrapper)

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to generate canvas from prescription')
      }

      const imgData = canvas.toDataURL('image/png')

      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to convert canvas to image')
      }

      const pdf = new jsPDF({
        orientation: prescriptionPdfSettings.orientation,
        unit: 'mm',
        format: prescriptionPdfSettings.format === 'custom' ? [prescriptionPdfSettings.width, prescriptionPdfSettings.height] : prescriptionPdfSettings.format
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      const marginTop = 5
      const marginBottom = 5
      const availableHeight = pdfHeight - marginTop - marginBottom
      const availableWidth = pdfWidth - 6

      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight)
      const imgScaledWidth = imgWidth * ratio
      const imgScaledHeight = imgHeight * ratio

      const marginX = (pdfWidth - imgScaledWidth) / 2

      pdf.addImage(imgData, 'PNG', marginX, marginTop, imgScaledWidth, imgScaledHeight)
      pdf.save(`Prescription_${checkup.id}_${patient?.name.replace(/\s+/g, '_')}.pdf`)

      // Log PDF generation activity
      if (user) {
        await logActivity({
          userId: user.uid,
          username: user.username || user.email,
          userRole: user.role,
          activityType: ACTIVITY_TYPES.CHECKUP_PDF_PRESCRIPTION,
          description: createActivityDescription(ACTIVITY_TYPES.CHECKUP_PDF_PRESCRIPTION, {
            billNo: checkup.billNo,
            patientName: patient?.name
          }),
          metadata: {
            checkupId: checkup.id,
            billNo: checkup.billNo,
            patientId: checkup.patientId,
            patientName: patient?.name,
            pdfType: 'prescription',
            medicinesCount: (checkup.prescriptionMedicines || []).length,
            format: prescriptionPdfSettings.format,
            orientation: prescriptionPdfSettings.orientation
          }
        })
      }

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Failed to generate PDF.\n\nError: ${error.message}\n\nPlease try:\n1. Refreshing the page\n2. Using the Print button instead\n3. Taking a screenshot of the prescription`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Show loading while data is being fetched
  if ((checkupsLoading || patientsLoading) && checkups.length === 0) {
    return <LoadingSpinner text="Loading checkup..." />
  }

  // Only show "not found" after data has loaded
  if ((!checkup || !patient) && checkups.length > 0) {
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

  // Still waiting for data
  if (!checkup || !patient) {
    return <LoadingSpinner text="Loading checkup..." />
  }

  const prescriptionMedicines = checkup.prescriptionMedicines || []
  const prescriptionNotes = checkup.prescriptionNotes || ''

  return (
    <Container fluid className="p-3 p-md-4">
      <Breadcrumb
        items={[{ label: 'Checkups', path: '/checkups' }]}
        current={checkup?.billNo || 'Checkup Details'}
      />

      {/* Patient Details */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2 px-3">
          <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.95rem)' }}>
            <span><strong>Patient:</strong> <a href={`/patients/${patient.id}`} onClick={(e) => { e.preventDefault(); navigate(`/patients/${patient.id}`) }} style={{ color: '#0891B2', textDecoration: 'none' }}>{patient.name}</a></span>
            <span><strong>Age:</strong> {patient.age}yr</span>
            <span><strong>Gender:</strong> {patient.gender}</span>
            <span><strong>Mobile:</strong> {patient.mobile}</span>
            <span><strong>Bill #:</strong> {checkup.billNo || checkup.id}</span>
            <span><strong>Date:</strong> {new Date(checkup.timestamp).toLocaleDateString()}</span>
          </div>
        </Card.Body>
      </Card>

      {/* Action Buttons */}
      <Row className="mb-3 no-print">
        <Col>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            {activeTab === 'details' && (
              <>
                <Button
                  onClick={handlePrint}
                  size="sm"
                  className="no-print btn-theme-success"
                >
                  <FaPrint className="me-2" />
                  Print
                </Button>
                <Button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                  size="sm"
                  className="no-print btn-theme-primary"
                >
                  <FaFilePdf className="me-2" />
                  {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                </Button>
              </>
            )}
            {activeTab === 'prescription' && (
              <>
                <Button
                  onClick={handlePrintPrescription}
                  size="sm"
                  className="no-print btn-theme-success"
                >
                  <FaPrint className="me-2" />
                  Print
                </Button>
                <Button
                  onClick={handleGeneratePrescriptionPDF}
                  disabled={isGenerating}
                  size="sm"
                  className="no-print btn-theme-primary"
                >
                  <FaFilePdf className="me-2" />
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </Button>
              </>
            )}
          </div>
        </Col>
      </Row>


      {/* Shared template styles for both invoice & prescription */}
      <style>{`
        .bill-content {
          max-width: 100%;
          box-sizing: border-box;
          overflow: visible;
        }
        .bill-content table,
        .bill-content th,
        .bill-content td {
          border: none !important;
        }

        /* === PDF / Print: compact professional layout === */
        .bill-content.printing {
          overflow: visible;
          page-break-inside: avoid;
          padding: 3% 10% !important;
        }
        .bill-content.printing * {
          box-sizing: border-box;
        }
        .bill-content.printing .template-wrapper {
          min-height: 100% !important;
          height: 100% !important;
        }
        .bill-content.printing img {
          max-width: 100%;
          height: auto;
        }

        /* Header */
        .bill-content.printing .header-section img {
          height: 28px !important;
        }
        .bill-content.printing .template-logo-asiri {
          height: 22px !important;
        }
        .bill-content.printing .header-section h4 {
          font-size: 8pt !important;
        }
        .bill-content.printing .header-section p,
        .bill-content.printing .header-section div {
          font-size: 5.5pt !important;
        }

        /* Patient info */
        .bill-content.printing .template-patient {
          font-size: 6.5pt !important;
        }

        /* Tables — compact rows, no borders */
        .bill-content.printing table {
          font-size: 7pt !important;
          border: none !important;
        }
        .bill-content.printing th,
        .bill-content.printing td {
          border: none !important;
        }
        .bill-content.printing th {
          padding: 3px 4px !important;
          vertical-align: middle !important;
        }
        .bill-content.printing td {
          padding: 2px 4px !important;
          vertical-align: middle !important;
        }
        .bill-content.printing .prescription-table {
          font-size: 6.5pt !important;
        }

        /* Prescription layout — stacked when printing for better readability */
        .bill-content.printing .prescription-body {
          flex-direction: column !important;
        }
        .bill-content.printing .prescription-left {
          flex: 1 1 auto !important;
          max-width: 100% !important;
          overflow: visible !important;
        }
        .bill-content.printing .prescription-right {
          flex: 1 1 auto !important;
          max-width: 100% !important;
          padding-left: 0 !important;
          border-left: none !important;
          border-top: 1px solid #e2e8f0 !important;
          padding-top: 0.4rem !important;
        }

        /* Lab results grid — wider in full-width layout */
        .bill-content.printing .lab-results-grid {
          grid-template-columns: 1fr 1fr 1fr !important;
          gap: 1px 6px !important;
        }
        .bill-content.printing .lab-results-grid strong {
          font-size: 5.5pt !important;
        }
        .bill-content.printing .lab-results-grid span {
          font-size: 5.5pt !important;
        }
        .bill-content.printing .lab-results-grid .lab-children-row span {
          font-size: 5pt !important;
        }

        /* Footer */
        .bill-content.printing .footer-section {
          font-size: 5pt !important;
        }
        .bill-content.printing .footer-section p {
          font-size: 5pt !important;
        }
        .bill-content.printing .footer-section img {
          height: 8px !important;
        }

        /* PAID stamp */
        .bill-content.printing .paid-stamp img {
          height: 65px !important;
        }

        /* Date/Signature lines */
        .bill-content.printing .date-signature-row p {
          font-size: 5.5pt !important;
        }
        .bill-content.printing .sig-line {
          width: 80px !important;
        }

        /* Hide fixed/absolute UI elements during PDF generation (sidebar, navbar, FAB, etc.) */
        body:has(.printing) .top-navbar,
        body:has(.printing) .sidebar,
        body:has(.printing) .sidebar-toggle,
        body:has(.printing) .sidebar-overlay {
          display: none !important;
          visibility: hidden !important;
        }

        /* === On-screen mobile === */
        @media (max-width: 767px) {
          .bill-content {
            padding: 0.75rem !important;
          }

          /* --- Header: centered stacked layout --- */
          .bill-content .template-logo-main {
            height: 35px !important;
          }
          .bill-content .template-title {
            font-size: 0.7rem !important;
          }
          .bill-content .header-section p,
          .bill-content .header-section div {
            font-size: 0.55rem !important;
          }
          .bill-content .template-logo-asiri {
            height: 18px !important;
          }

          /* --- Patient info: wrap naturally on mobile --- */
          .bill-content .template-patient {
            font-size: 0.6rem !important;
          }

          /* --- Footer: stacked contacts, centered thank you --- */
          .bill-content .footer-section {
            font-size: 0.55rem !important;
          }
          .bill-content .footer-contacts {
            flex-direction: column !important;
          }
          .bill-content .footer-contacts > div:last-child {
            text-align: left !important;
          }
          .bill-content .footer-thankyou > div {
            flex-direction: column !important;
            gap: 2px !important;
          }
          .bill-content .footer-asiri-logo {
            display: block !important;
            margin: 0 auto !important;
          }

          /* --- Prescription: stack 70/30, 3-col lab grid --- */
          .bill-content .prescription-body {
            flex-direction: column !important;
          }
          .bill-content .prescription-left {
            flex: 1 1 100% !important;
            max-width: 100% !important;
          }
          .bill-content .prescription-right {
            flex: 1 1 100% !important;
            max-width: 100% !important;
            border-left: none !important;
            border-top: 1px solid #e2e8f0 !important;
            padding-left: 0 !important;
            padding-top: 0.5rem !important;
          }
          .bill-content .lab-results-grid {
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 0px 8px !important;
          }
          .bill-content .lab-results-grid strong,
          .bill-content .lab-results-grid span {
            font-size: 0.55rem !important;
          }

          /* --- Tables --- */
          .bill-content table {
            font-size: 0.65rem !important;
          }
          .bill-content th,
          .bill-content td {
            padding: 0.15rem 0.25rem !important;
          }
          .bill-content th {
            font-size: 0.6rem !important;
            font-weight: 600 !important;
            text-transform: none !important;
          }

          /* --- Prescription table: compact for mobile --- */
          .prescription-table {
            font-size: 0.6rem !important;
          }
          .prescription-table th {
            font-size: 0.55rem !important;
            padding: 0.15rem 0.2rem !important;
            white-space: nowrap !important;
          }
          .prescription-table td {
            padding: 0.15rem 0.2rem !important;
            font-size: 0.6rem !important;
          }
          /* Hide instructions column on very small screens */
          @media (max-width: 420px) {
            .prescription-table th:nth-child(4),
            .prescription-table td:nth-child(4) {
              display: none !important;
            }
          }

          /* --- Section headings --- */
          .bill-content h6 {
            font-size: 0.7rem !important;
          }

          /* --- Date / Signature lines --- */
          .bill-content .date-signature-row {
            gap: 0.5rem !important;
          }
          .bill-content .date-signature-row > div {
            flex: 1 !important;
          }
          .bill-content .date-signature-row .sig-line {
            width: 100% !important;
          }

          /* --- PAID stamp --- */
          .bill-content .paid-stamp img {
            height: 50px !important;
          }

          /* --- Notes text --- */
          .bill-content .notes-text {
            font-size: 0.65rem !important;
          }

          /* --- Lab results children row on narrow screens --- */
          .bill-content .lab-children-row {
            flex-wrap: wrap !important;
            gap: 2px 8px !important;
          }
        }
        @media (min-width: 768px) and (max-width: 991px) {
          .prescription-table {
            font-size: 0.8rem !important;
          }
        }
      `}</style>

      {/* Tabbed Interface */}
      <Row>
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3 no-print tabs-theme"
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

      {/* Invoice Preview */}
      {activeTab === 'details' && (
        <Row>
          <Col>
          <style>{`
            @media print {
              @page {
                size: ${pdfSettings.format === 'a4' ? 'A4' :
                       pdfSettings.format === 'a5' ? 'A5' :
                       pdfSettings.format === 'letter' ? 'letter' :
                       `${pdfSettings.width}mm ${pdfSettings.height}mm`};
                margin: 10mm;
              }
            }
            ${pdfSettings.width < 100 ? `
              .bill-content.printing .header-section {
                flex-direction: column !important;
                text-align: center !important;
              }
              .bill-content.printing .header-section img {
                height: 30px !important;
                margin: 0 auto 3px !important;
              }
              .bill-content.printing .header-section h4 {
                font-size: 0.7rem !important;
              }
              .bill-content.printing table {
                font-size: 0.6rem !important;
              }
              .bill-content.printing th,
              .bill-content.printing td {
                padding: 0.15rem 0.25rem !important;
              }
            ` : ''}
          `}</style>
          <Card className="shadow-sm">
            <Card.Body ref={billRef} className="bill-content" style={{ padding: 'clamp(0.75rem, 3vw, 2.5rem)', backgroundColor: 'white' }}>
              {renderTemplate(
                <>
                  {/* Tests Table */}
                  <div className="mb-3">
                    <h6 style={{ color: '#0891B2', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.95rem)' }}>Tests Performed</h6>
                    <table style={{ width: '100%', marginBottom: '0', fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)', border: 'none', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #0891B2' }}>
                          <th style={{ width: '60%', color: '#0891B2', padding: 'clamp(0.35rem, 1vw, 0.6rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'left' }}>Test Name</th>
                          <th style={{ width: '40%', color: '#0891B2', padding: 'clamp(0.35rem, 1vw, 0.6rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'right' }}>Price (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkup.tests.map((testItem) => {
                          const test = tests.find(t => t.id === testItem.testId)
                          return test ? (
                            <tr key={testItem.testId}>
                              <td style={{ padding: 'clamp(0.2rem, 0.8vw, 0.4rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'left' }}>
                                <strong style={{ color: '#0891B2' }}>{test.code}</strong> - {test.name}
                              </td>
                              <td style={{ padding: 'clamp(0.2rem, 0.8vw, 0.4rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'right' }}>Rs. {test.price.toFixed(2)}</td>
                            </tr>
                          ) : null
                        })}
                        <tr style={{ color: '#0891B2', fontWeight: 'bold', borderTop: '1px solid #0891B2' }}>
                          <td style={{ padding: 'clamp(0.35rem, 1vw, 0.6rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'left' }}>Total Amount</td>
                          <td style={{ padding: 'clamp(0.35rem, 1vw, 0.6rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'right' }}>Rs. {checkup.total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* General Notes */}
                  {checkup.notes && (
                    <div className="mb-3">
                      <h6 style={{ color: '#0891B2', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.95rem)' }}>Notes</h6>
                      <p className="notes-text" style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)', color: '#475569', lineHeight: '1.5', marginBottom: 0 }}>
                        {checkup.notes}
                      </p>
                    </div>
                  )}

                  {/* PAID Stamp */}
                  <div className="text-center mb-1 paid-stamp" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <img src={paidStampImg} alt="PAID" style={{ height: 'clamp(60px, 12vw, 100px)', opacity: 0.85 }} />
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      {/* Prescription Tab */}
      {activeTab === 'prescription' && (
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body ref={prescriptionRef} className="bill-content" style={{ padding: 'clamp(0.75rem, 3vw, 2.5rem)', backgroundColor: 'white' }}>
                {renderTemplate(
                  <>
                    {/* Body: 70% left / 30% right */}
                    <div className="prescription-body" style={{ display: 'flex', gap: '0.75rem' }}>
                      {/* Left — main content */}
                      <div className="prescription-left" style={{ flex: '0 0 70%', maxWidth: '70%' }}>
                        {/* Medicines Table */}
                        {prescriptionMedicines.length > 0 && (
                          <div className="mb-3">
                            <h6 style={{ color: '#0891B2', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.95rem)' }}>℞ Prescribed Medications</h6>
                            <table className="prescription-table" style={{ width: '100%', marginBottom: '0', fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)', border: 'none', borderCollapse: 'collapse', textAlign: 'center' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid #0891B2' }}>
                                  <th style={{ color: '#0891B2', padding: 'clamp(0.35rem, 1vw, 0.6rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'left' }}>Medicine (Brand)</th>
                                  <th style={{ color: '#0891B2', padding: 'clamp(0.35rem, 1vw, 0.6rem) clamp(0.3rem, 1vw, 0.6rem)', width: '15%', border: 'none', textAlign: 'center' }}>Dosage</th>
                                  <th style={{ color: '#0891B2', padding: 'clamp(0.35rem, 1vw, 0.6rem) clamp(0.3rem, 1vw, 0.6rem)', width: '15%', border: 'none', textAlign: 'center' }}>Qty</th>
                                  <th style={{ color: '#0891B2', padding: 'clamp(0.35rem, 1vw, 0.6rem) clamp(0.3rem, 1vw, 0.6rem)', width: '25%', border: 'none', textAlign: 'center' }}>Instructions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prescriptionMedicines.map((med, index) => {
                                  const medicine = medicines.find(m => m.id === med.medicineId)
                                  return medicine ? (
                                    <tr key={index}>
                                      <td style={{ padding: 'clamp(0.2rem, 0.8vw, 0.4rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'left' }}>
                                        <strong>{medicine.name}</strong>
                                        <br />
                                        <span style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)', color: '#64748b' }}>{medicine.brand}</span>
                                      </td>
                                      <td style={{ padding: 'clamp(0.2rem, 0.8vw, 0.4rem) clamp(0.3rem, 1vw, 0.6rem)', fontWeight: '600', color: '#059669', border: 'none', textAlign: 'center' }}>{Array.isArray(medicine.dosage) ? medicine.dosage.join(', ') : (medicine.dosage || '-')}</td>
                                      <td style={{ padding: 'clamp(0.2rem, 0.8vw, 0.4rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'center' }}>{med.quantity ? `${med.quantity} ${medicine.unit}` : '-'}</td>
                                      <td style={{ padding: 'clamp(0.2rem, 0.8vw, 0.4rem) clamp(0.3rem, 1vw, 0.6rem)', border: 'none', textAlign: 'center' }}>{med.instructions || '-'}</td>
                                    </tr>
                                  ) : null
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Additional Notes */}
                        {prescriptionNotes && (
                          <div className="mb-3">
                            <h6 style={{ color: '#0891B2', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.95rem)' }}>Instructions</h6>
                            <p className="notes-text" style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)', color: '#475569', whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                              {prescriptionNotes}
                            </p>
                          </div>
                        )}

                        {/* Empty State */}
                        {prescriptionMedicines.length === 0 && !prescriptionNotes && (
                          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <FaPrescriptionBottleAlt size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ fontSize: '0.9rem' }}>
                              <em>No prescription added yet. Go to <a href={`/checkups/${id}`} onClick={(e) => { e.preventDefault(); navigate(`/checkups/${id}`) }} style={{ color: '#0891B2' }}>Edit Checkup</a> to add medicines and instructions.</em>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right — general tests + lab results grid */}
                      <div className="prescription-right" style={{ flex: '0 0 28%', maxWidth: '28%', borderLeft: '1px solid #e2e8f0', paddingLeft: '0.5rem' }}>
                        {/* General Tests */}
                        {generalTestFields.length > 0 && (
                          <>
                            <div style={{ marginBottom: '4px' }}>
                              <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.7rem)', color: '#0891B2' }}>General</strong>
                            </div>
                            <div className="lab-results-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 6px', marginBottom: '6px' }}>
                              {(() => {
                                const genShowEmpty = settings?.generalTests?.showEmpty || 'hide'
                                const shouldShow = (fieldDisplay, value) => {
                                  const effective = fieldDisplay === 'default' ? genShowEmpty : (fieldDisplay === 'always' ? 'na' : 'hide')
                                  if (value) return true
                                  return effective !== 'hide'
                                }
                                const emptyText = (fieldDisplay) => {
                                  const effective = fieldDisplay === 'default' ? genShowEmpty : (fieldDisplay === 'always' ? 'na' : 'hide')
                                  return effective === 'na' ? 'N/A' : ''
                                }
                                return generalTestFields.map(({ key, label, display, children }) => {
                                  const val = checkup.generalTests?.[key]
                                  const childrenHaveValues = children?.some(({ key: ck }) => checkup.generalTests?.[ck])
                                  const parentShouldShow = shouldShow(display, val) || childrenHaveValues ||
                                    children?.some(({ key: ck, display: cd }) => shouldShow(cd, checkup.generalTests?.[ck]))
                                  if (!children && !shouldShow(display, val)) return null
                                  if (children && !parentShouldShow) return null

                                  return children ? (
                                    <div key={key} style={{ gridColumn: '1 / -1' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minHeight: '20px' }}>
                                        <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', whiteSpace: 'nowrap' }}>{label}:</strong>
                                        <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)' }}>{val || emptyText(display)}</span>
                                      </div>
                                      <div className="lab-children-row" style={{ display: 'flex', gap: '6px', paddingLeft: '0.5rem', marginTop: '1px' }}>
                                        {children.map(({ key: ck, label: cl, display: cd }) => {
                                          const cv = checkup.generalTests?.[ck]
                                          if (!shouldShow(cd, cv)) return null
                                          return (
                                            <div key={ck} style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
                                              <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', color: '#64748b', whiteSpace: 'nowrap' }}>{cl}:</span>
                                              <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)' }}>{cv || emptyText(cd)}</span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '2px', minHeight: '20px' }}>
                                      <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', whiteSpace: 'nowrap' }}>{label}:</strong>
                                      <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)' }}>{val || emptyText(display)}</span>
                                    </div>
                                  )
                                })
                              })()}
                            </div>
                          </>
                        )}

                        {/* Lab Results */}
                        {labResultFields.length > 0 && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.7rem)', color: '#0891B2' }}>Lab Results</strong>
                          </div>
                        )}
                        <div className="lab-results-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 6px' }}>
                          {(() => {
                            const shouldShow = (fieldDisplay, value) => {
                              const effective = fieldDisplay === 'default' ? labResultsShowEmpty : (fieldDisplay === 'always' ? 'na' : 'hide')
                              if (value) return true
                              return effective !== 'hide'
                            }
                            const emptyText = (fieldDisplay) => {
                              const effective = fieldDisplay === 'default' ? labResultsShowEmpty : (fieldDisplay === 'always' ? 'na' : 'hide')
                              return effective === 'na' ? 'N/A' : ''
                            }

                            return labResultFields.map(({ key, label, display, children }) => {
                              const val = checkup.labResults?.[key]
                              const childrenHaveValues = children?.some(({ key: ck }) => checkup.labResults?.[ck])
                              const parentShouldShow = shouldShow(display, val) || childrenHaveValues ||
                                children?.some(({ key: ck, display: cd }) => shouldShow(cd, checkup.labResults?.[ck]))
                              if (!children && !shouldShow(display, val)) return null
                              if (children && !parentShouldShow) return null

                              return children ? (
                                <div key={key} style={{ gridColumn: '1 / -1' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minHeight: '20px' }}>
                                    <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', whiteSpace: 'nowrap' }}>{label}:</strong>
                                    <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)' }}>{val || emptyText(display)}</span>
                                  </div>
                                  <div className="lab-children-row" style={{ display: 'flex', gap: '6px', paddingLeft: '0.5rem', marginTop: '1px' }}>
                                    {children.map(({ key: ck, label: cl, display: cd }) => {
                                      const cv = checkup.labResults?.[ck]
                                      if (!shouldShow(cd, cv)) return null
                                      return (
                                        <div key={ck} style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
                                          <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', color: '#64748b', whiteSpace: 'nowrap' }}>{cl}:</span>
                                          <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)' }}>{cv || emptyText(cd)}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '2px', minHeight: '20px' }}>
                                  <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', whiteSpace: 'nowrap' }}>{label}:</strong>
                                  <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)' }}>{val || emptyText(display)}</span>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Date / Signature lines */}
                    <div className="date-signature-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '1rem' }}>
                      <div>
                        <div className="sig-line" style={{ borderTop: '1px solid #64748b', width: 'clamp(80px, 15vw, 120px)', marginBottom: '0.25rem' }} />
                        <p style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', marginBottom: 0 }}>Date</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="sig-line" style={{ borderTop: '1px solid #64748b', width: 'clamp(80px, 15vw, 120px)', marginBottom: '0.25rem' }} />
                        <p style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', marginBottom: 0 }}>Signature</p>
                      </div>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

    </Container>
  )
}

export default CheckupDetail
