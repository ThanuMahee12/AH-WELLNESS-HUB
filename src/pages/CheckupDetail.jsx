import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { FaFilePdf, FaPrint, FaFacebook, FaInstagram, FaEnvelope, FaPhone, FaPrescriptionBottleAlt, FaArrowLeft } from 'react-icons/fa'
import { Breadcrumb } from '../components/ui'
import { selectAllCheckups, fetchCheckups } from '../store/checkupsSlice'
import { selectAllPatients, fetchPatients } from '../store/patientsSlice'
import { selectAllTests, fetchTests } from '../store/testsSlice'
import { selectAllMedicines, fetchMedicines } from '../store/medicinesSlice'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'
import { useSettings } from '../hooks/useSettings'
import { useNotification } from '../context'
import LoadingSpinner from '../components/common/LoadingSpinner'
import bloodLabLogo from '../assets/blood-lab-logo.png'
import asiriLogo from '../assets/asiri-logo.png'
import paidStampImg from '../assets/paid-stamp.png'
import { evaluateRules, getDisplayStyle, renderNotation, hasStyleKeyword } from '../utils/evaluateRule'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function CheckupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const billRef = useRef()
  const prescriptionRef = useRef()
  const { error: showError } = useNotification()

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

  // Apply rules to a value and return { text, labelStyle }
  // fieldNotation: field-level notation template (e.g. '{value}({label})')
  // Rule notation overrides field notation for the label portion
  const applyRules = (value, rules, fieldNotation) => {
    if (!value) return { text: null, labelStyle: {} }
    if (!rules) {
      // No rules — use field notation to render value if provided
      if (fieldNotation && fieldNotation !== '{value}({label})') {
        const rendered = renderNotation(fieldNotation, value, '')
        return { text: rendered, labelStyle: {}, replaceValue: true }
      }
      return { text: null, labelStyle: {} }
    }
    const result = evaluateRules(value, rules)
    if (!result) return { text: null, labelStyle: {} }
    // Rule notation for the annotation (e.g. '{label}', '{value} ({label})')
    const ruleNotation = result.notation || '{label}'
    const notationText = renderNotation(ruleNotation, value, result.label)
    // If field notation uses {style}, apply rule's display style to the whole output
    const useStyle = hasStyleKeyword(fieldNotation) || hasStyleKeyword(ruleNotation)
    const labelStyle = useStyle ? getDisplayStyle(result.display) : {}
    return { text: notationText, labelStyle }
  }

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
  const renderTemplate = (children, type = 'invoice') => (
    <div className="template-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div className="mb-2 pb-1 header-section" style={{ borderBottom: '2px solid #0891B2', textAlign: 'center' }}>
        <img src={bloodLabLogo} alt="AWH Logo" className="template-logo-main" style={{ height: 'clamp(35px, 5vw, 50px)', objectFit: 'contain', marginBottom: '0.25rem' }} />
        <h4 className="template-title" style={{ color: '#0891B2', fontWeight: 'bold', marginBottom: '0.15rem', fontSize: 'clamp(0.65rem, 2vw, 0.9rem)' }}>
          {type === 'prescription' ? 'AH WELLNESS HUB' : 'AH WELLNESS HUB & ASIRI LABORATORIES'}
        </h4>
        <p style={{ color: '#64748b', fontSize: 'clamp(0.5rem, 1.5vw, 0.65rem)', marginBottom: '0.15rem' }}>Complete Health Care Solutions</p>
        <div style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.6rem)', color: '#64748b', marginBottom: '0.25rem' }}>
          <span><strong>Bill #:</strong> {checkup.billNo || checkup.id}</span>
          {' | '}
          <span>{new Date(checkup.timestamp).toLocaleDateString()}</span>
          {' | '}
          <span>{new Date(checkup.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {type !== 'prescription' && (
          <img src={asiriLogo} alt="ASIRI Logo" className="template-logo-asiri" style={{ height: 'clamp(20px, 3vw, 30px)', objectFit: 'contain', opacity: 0.8 }} />
        )}
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
      {(() => {
        const footer = settings?.checkupPdf?.footer || {}
        const mobile = footer.mobile || { label: 'Mobile', value: '+94 72 338 8793', visible: true }
        const email = footer.email || { label: 'Email', value: 'vijayjena@yahoo.com', visible: true }
        const instagram = footer.instagram || { label: 'IG', value: 'wijayjena2', visible: true }
        const facebook = footer.facebook || { label: 'FB', value: 'drwjanakan', visible: true }
        const thankYouText = type === 'prescription'
          ? (footer.thankYouPrescription || 'Thank you for choosing AH Wellness Hub')
          : (footer.thankYouInvoice || 'Thank you for choosing AH Wellness Hub & Asiri Laboratories')
        const FOOTER_ICONS = { mobile: FaPhone, email: FaEnvelope, instagram: FaInstagram, facebook: FaFacebook }
        const leftItems = [mobile, email].filter(i => i.visible !== false)
        const rightItems = [instagram, facebook].filter(i => i.visible !== false)
        return (
          <div className="mt-auto pt-1 footer-section" style={{ borderTop: '1px solid #e2e8f0', fontSize: 'clamp(0.45rem, 1.3vw, 0.6rem)' }}>
            <div className="footer-contacts" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '0.25rem' }}>
              <div>
                {leftItems.map((item, i) => {
                  const Icon = i === 0 ? FaPhone : FaEnvelope
                  return (
                    <p key={i} className="mb-0">
                      <Icon className="me-1" style={{ color: '#0891B2', fontSize: 'clamp(0.4rem, 1.2vw, 0.55rem)' }} />
                      <strong>{item.label}:</strong> {item.value}
                    </p>
                  )
                })}
              </div>
              <div style={{ textAlign: 'right' }}>
                {rightItems.map((item, i) => {
                  const Icon = i === 0 ? FaInstagram : FaFacebook
                  return (
                    <p key={i} className="mb-0">
                      <Icon className="me-1" style={{ color: '#0891B2', fontSize: 'clamp(0.4rem, 1.2vw, 0.55rem)' }} />
                      <strong>{item.label}:</strong> {item.value}
                    </p>
                  )
                })}
              </div>
            </div>
            <div className="text-center mt-1 pt-1 footer-thankyou" style={{ borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '0.15rem' }}>
                <p style={{ fontSize: 'clamp(0.4rem, 1.2vw, 0.55rem)', color: '#94a3b8', marginBottom: 0 }}>
                  {thankYouText}
                </p>
                {type !== 'prescription' && (
                  <img src={asiriLogo} alt="Powered by ASIRI" className="footer-asiri-logo" style={{ height: 'clamp(10px, 2vw, 15px)', opacity: 0.7, objectFit: 'contain' }} title="Powered by ASIRI Laboratories" />
                )}
              </div>
            </div>
          </div>
        )
      })()}
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
      showError('Invoice content not found. Please refresh the page and try again.')
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

      // Clone the bill content inside an iframe to avoid body:has(.printing) hiding UI
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;overflow:visible;pointer-events:none;'
      const billClone = element.cloneNode(true)
      billClone.classList.add('pdf-clone')
      const pageHeightPx = Math.round(pdfSettings.height * 96 / 25.4)
      billClone.style.width = pageWidthPx + 'px'
      billClone.style.minHeight = pageHeightPx + 'px'
      billClone.style.display = 'flex'
      billClone.style.flexDirection = 'column'
      billClone.style.padding = pageWidthMm < 100 ? '12px 16px' : '16px 32px'
      billClone.style.fontSize = pageWidthMm < 100 ? '10px' : pageWidthMm <= 160 ? '12px' : '14px'
      billClone.style.backgroundColor = '#ffffff'
      billClone.style.boxSizing = 'border-box'
      billClone.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      billClone.style.lineHeight = '1.4'
      billClone.style.color = '#333'
      wrapper.appendChild(billClone)
      document.body.appendChild(wrapper)

      // Normalize clamp() values to fixed sizes for clean PDF rendering
      const baseFontPx = pageWidthMm < 100 ? 10 : pageWidthMm <= 160 ? 12 : 14
      const pdfStyles = document.createElement('style')
      pdfStyles.textContent = `
        .bill-content.pdf-clone .template-wrapper { min-height: 100% !important; height: 100% !important; flex: 1 !important; display: flex !important; flex-direction: column !important; }
        .bill-content.pdf-clone .template-logo-main { height: ${Math.round(baseFontPx * 3.5)}px !important; }
        .bill-content.pdf-clone .template-logo-asiri { height: ${Math.round(baseFontPx * 2)}px !important; }
        .bill-content.pdf-clone .template-title { font-size: ${Math.round(baseFontPx * 1.3)}px !important; margin-bottom: 2px !important; }
        .bill-content.pdf-clone .header-section { padding-bottom: 6px !important; margin-bottom: 8px !important; }
        .bill-content.pdf-clone .header-section p { font-size: ${Math.round(baseFontPx * 0.85)}px !important; margin-bottom: 2px !important; }
        .bill-content.pdf-clone .header-section div { font-size: ${Math.round(baseFontPx * 0.8)}px !important; }
        .bill-content.pdf-clone .template-patient { font-size: ${Math.round(baseFontPx * 0.9)}px !important; margin-bottom: 6px !important; }
        .bill-content.pdf-clone .template-patient .patient-row { gap: 4px ${Math.round(baseFontPx * 1.2)}px !important; }
        .bill-content.pdf-clone h6 { font-size: ${Math.round(baseFontPx * 1.1)}px !important; margin-bottom: 4px !important; }
        .bill-content.pdf-clone table { font-size: ${baseFontPx}px !important; }
        .bill-content.pdf-clone th { padding: 4px 6px !important; font-size: ${baseFontPx}px !important; }
        .bill-content.pdf-clone td { padding: 3px 6px !important; font-size: ${baseFontPx}px !important; }
        .bill-content.pdf-clone .notes-text { font-size: ${Math.round(baseFontPx * 0.9)}px !important; }
        .bill-content.pdf-clone .paid-stamp img { height: ${Math.round(baseFontPx * 6)}px !important; }
        .bill-content.pdf-clone .footer-section { font-size: ${Math.round(baseFontPx * 0.75)}px !important; }
        .bill-content.pdf-clone .footer-section p { font-size: ${Math.round(baseFontPx * 0.75)}px !important; }
        .bill-content.pdf-clone .footer-contacts svg { font-size: ${Math.round(baseFontPx * 0.7)}px !important; }
        .bill-content.pdf-clone .footer-thankyou p { font-size: ${Math.round(baseFontPx * 0.7)}px !important; }
        .bill-content.pdf-clone .footer-asiri-logo { height: ${Math.round(baseFontPx * 1.2)}px !important; }
      `
      wrapper.appendChild(pdfStyles)

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
      const nowTs = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
      pdf.save(`Bill_${checkup.billNo || checkup.id}_${nowTs}.pdf`)

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
      showError(`Failed to generate invoice PDF: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGeneratePrescriptionPDF = async () => {
    if (!prescriptionRef.current) {
      showError('Prescription content not found. Please refresh the page and try again.')
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

      // Clone inside wrapper — use pdf-clone class to avoid body:has(.printing) hiding UI
      const rxWrapper = document.createElement('div')
      rxWrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;overflow:visible;pointer-events:none;'
      const prescriptionClone = element.cloneNode(true)
      prescriptionClone.classList.add('pdf-clone')
      const rxPageHeightPx = Math.round(prescriptionPdfSettings.height * 96 / 25.4)
      prescriptionClone.style.width = rxPageWidthPx + 'px'
      prescriptionClone.style.minHeight = rxPageHeightPx + 'px'
      prescriptionClone.style.display = 'flex'
      prescriptionClone.style.flexDirection = 'column'
      prescriptionClone.style.padding = rxPageWidthMm < 100 ? '12px 16px' : '16px 32px'
      prescriptionClone.style.fontSize = rxPageWidthMm < 100 ? '10px' : rxPageWidthMm <= 160 ? '12px' : '14px'
      prescriptionClone.style.backgroundColor = '#ffffff'
      prescriptionClone.style.boxSizing = 'border-box'
      prescriptionClone.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      prescriptionClone.style.lineHeight = '1.4'
      prescriptionClone.style.color = '#333'

      // Normalize clamp() values to fixed sizes for clean PDF rendering
      const rxBaseFontPx = rxPageWidthMm < 100 ? 10 : rxPageWidthMm <= 160 ? 12 : 14
      const rxPdfStyles = document.createElement('style')
      rxPdfStyles.textContent = `
        .bill-content.pdf-clone .template-wrapper { min-height: 100% !important; height: 100% !important; flex: 1 !important; display: flex !important; flex-direction: column !important; }
        .bill-content.pdf-clone .template-logo-main { height: ${Math.round(rxBaseFontPx * 3.5)}px !important; }
        .bill-content.pdf-clone .template-logo-asiri { height: ${Math.round(rxBaseFontPx * 2)}px !important; }
        .bill-content.pdf-clone .template-title { font-size: ${Math.round(rxBaseFontPx * 1.3)}px !important; margin-bottom: 2px !important; }
        .bill-content.pdf-clone .header-section { padding-bottom: 6px !important; margin-bottom: 8px !important; }
        .bill-content.pdf-clone .header-section p { font-size: ${Math.round(rxBaseFontPx * 0.85)}px !important; margin-bottom: 2px !important; }
        .bill-content.pdf-clone .header-section div { font-size: ${Math.round(rxBaseFontPx * 0.8)}px !important; }
        .bill-content.pdf-clone .template-patient { font-size: ${Math.round(rxBaseFontPx * 0.9)}px !important; margin-bottom: 6px !important; }
        .bill-content.pdf-clone .template-patient .patient-row { gap: 4px ${Math.round(rxBaseFontPx * 1.2)}px !important; }
        .bill-content.pdf-clone h6 { font-size: ${Math.round(rxBaseFontPx * 1.1)}px !important; margin-bottom: 4px !important; }

        /* Prescription 80/20 layout */
        .bill-content.pdf-clone .prescription-body { display: flex !important; flex-direction: row !important; gap: 0px !important; }
        .bill-content.pdf-clone .prescription-left { flex: 1 1 auto !important; max-width: 80% !important; overflow: hidden !important; padding-right: 8px !important; }
        .bill-content.pdf-clone .prescription-right { flex: 0 0 20% !important; max-width: 20% !important; padding-left: 8px !important; border-left: 1px solid #e2e8f0 !important; }

        /* Prescription table — smaller font, all columns visible */
        .bill-content.pdf-clone .prescription-table { font-size: ${Math.round(rxBaseFontPx * 0.85)}px !important; width: 100% !important; table-layout: fixed !important; }
        .bill-content.pdf-clone .prescription-table * { font-size: ${Math.round(rxBaseFontPx * 0.85)}px !important; }
        .bill-content.pdf-clone .prescription-table th { padding: 3px 4px !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
        .bill-content.pdf-clone .prescription-table td { padding: 2px 4px !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
        .bill-content.pdf-clone .prescription-table th:first-child { width: 35% !important; }
        .bill-content.pdf-clone .prescription-table th:nth-child(2) { width: 18% !important; }
        .bill-content.pdf-clone .prescription-table th:nth-child(3) { width: 18% !important; }
        .bill-content.pdf-clone .prescription-table th:nth-child(4) { width: 29% !important; }
        .bill-content.pdf-clone table { font-size: ${Math.round(rxBaseFontPx * 0.85)}px !important; }
        .bill-content.pdf-clone th { padding: 3px 4px !important; font-size: ${Math.round(rxBaseFontPx * 0.85)}px !important; }
        .bill-content.pdf-clone td { padding: 2px 4px !important; font-size: ${Math.round(rxBaseFontPx * 0.85)}px !important; }

        /* Lab results — single column list, no grid */
        .bill-content.pdf-clone .lab-results-grid { display: flex !important; flex-direction: column !important; gap: 1px !important; }
        .bill-content.pdf-clone .lab-results-grid strong { font-size: ${Math.round(rxBaseFontPx * 0.7)}px !important; white-space: nowrap !important; }
        .bill-content.pdf-clone .lab-results-grid span { font-size: ${Math.round(rxBaseFontPx * 0.7)}px !important; }
        .bill-content.pdf-clone .lab-results-grid > div { min-height: auto !important; }
        .bill-content.pdf-clone .lab-results-grid .lab-children-row { flex-direction: column !important; gap: 0px !important; padding-left: 4px !important; margin-top: 0px !important; }
        .bill-content.pdf-clone .lab-results-grid .lab-children-row span { font-size: ${Math.round(rxBaseFontPx * 0.6)}px !important; }
        .bill-content.pdf-clone .prescription-right strong[style*="color"] { font-size: ${Math.round(rxBaseFontPx * 0.8)}px !important; }

        .bill-content.pdf-clone .notes-text { font-size: ${Math.round(rxBaseFontPx * 0.9)}px !important; }
        .bill-content.pdf-clone .date-signature-row { padding-top: 8px !important; }
        .bill-content.pdf-clone .sig-line { width: 100px !important; }
        .bill-content.pdf-clone .date-signature-row p { font-size: ${Math.round(rxBaseFontPx * 0.85)}px !important; }
        .bill-content.pdf-clone .esign-img { height: ${Math.round(rxBaseFontPx * 3.5)}px !important; }

        /* Footer */
        .bill-content.pdf-clone .footer-section { font-size: ${Math.round(rxBaseFontPx * 0.75)}px !important; }
        .bill-content.pdf-clone .footer-section p { font-size: ${Math.round(rxBaseFontPx * 0.75)}px !important; }
        .bill-content.pdf-clone .footer-contacts svg { font-size: ${Math.round(rxBaseFontPx * 0.7)}px !important; }
        .bill-content.pdf-clone .footer-thankyou p { font-size: ${Math.round(rxBaseFontPx * 0.7)}px !important; }
        .bill-content.pdf-clone .footer-asiri-logo { height: ${Math.round(rxBaseFontPx * 1.2)}px !important; }
      `
      rxWrapper.appendChild(prescriptionClone)
      rxWrapper.appendChild(rxPdfStyles)
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
      const rxNowTs = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
      pdf.save(`Prescription_${checkup.billNo || checkup.id}_${rxNowTs}.pdf`)

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
      showError(`Failed to generate prescription PDF: ${error.message}`)
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
    <Container fluid className="p-3 p-md-4 d-flex flex-column" style={{ height: 'calc(100vh - 52px)' }}>
      <div className="flex-shrink-0">
        <Breadcrumb
          items={[{ label: 'Checkups', path: '/checkups' }]}
          current={checkup?.billNo || 'Checkup Details'}
        />

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-2 no-print">
          <div>
            <h6 className="mb-0 fw-bold" style={{ fontSize: '1rem' }}>
              <FaFilePdf className="me-2 text-theme" size={16} />
              {checkup?.billNo || 'Invoice / Prescription'}
            </h6>
            <small className="text-muted" style={{ fontSize: '0.72rem' }}>
              {patient?.name} &middot; {patient?.age}yr &middot; {patient?.gender} &middot; {new Date(checkup?.timestamp).toLocaleDateString()}
            </small>
          </div>
          <div className="d-flex gap-1">
            <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/checkups/${id}`)} style={{ fontSize: '0.72rem' }}>
              <FaArrowLeft className="me-1" size={10} /> Edit
            </Button>
            <Button size="sm" onClick={activeTab === 'details' ? handlePrint : handlePrintPrescription} style={{ fontSize: '0.72rem', backgroundColor: '#14B8A6', borderColor: '#14B8A6' }}>
              <FaPrint className="me-1" size={10} /> Print
            </Button>
            <Button size="sm" onClick={activeTab === 'details' ? handleGeneratePDF : handleGeneratePrescriptionPDF} disabled={isGenerating} style={{ fontSize: '0.72rem', backgroundColor: '#0891B2', borderColor: '#0891B2' }}>
              <FaFilePdf className="me-1" size={10} /> {isGenerating ? 'Generating...' : 'PDF'}
            </Button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="border-bottom no-print" style={{ backgroundColor: '#fff' }}>
          <div className="d-flex gap-0">
            {[
              { key: 'details', label: 'Invoice', icon: FaFilePdf },
              { key: 'prescription', label: 'Prescription', icon: FaPrescriptionBottleAlt },
            ].map(tab => (
              <button key={tab.key} className={`btn btn-link text-decoration-none px-3 py-2 ${activeTab === tab.key ? 'fw-semibold' : ''}`} onClick={() => setActiveTab(tab.key)}
                style={{ fontSize: '0.8rem', color: activeTab === tab.key ? '#0891B2' : '#64748b', borderRadius: 0, borderBottom: activeTab === tab.key ? '2px solid #0891B2' : '2px solid transparent' }}>
                <tab.icon className="me-1" size={13} />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: 12 }}>


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
          height: 24px !important;
        }
        .bill-content.printing .template-logo-asiri {
          height: 18px !important;
        }
        .bill-content.printing .header-section h4 {
          font-size: 7pt !important;
        }
        .bill-content.printing .header-section p,
        .bill-content.printing .header-section div {
          font-size: 5pt !important;
        }

        /* Patient info */
        .bill-content.printing .template-patient {
          font-size: 5.5pt !important;
        }

        /* Tables — compact rows, no borders */
        .bill-content.printing table {
          font-size: 5.5pt !important;
          border: none !important;
        }
        .bill-content.printing th,
        .bill-content.printing td {
          border: none !important;
        }
        .bill-content.printing th {
          padding: 2px 3px !important;
          vertical-align: middle !important;
        }
        .bill-content.printing td {
          padding: 1px 3px !important;
          vertical-align: middle !important;
        }
        .bill-content.printing .prescription-table {
          font-size: 5pt !important;
        }

        /* Prescription headings */
        .bill-content.printing h6 {
          font-size: 6pt !important;
          margin-bottom: 2px !important;
        }
        .bill-content.printing .prescription-left p,
        .bill-content.printing .prescription-left span {
          font-size: 5pt !important;
        }

        /* Prescription layout — keep 70/30 side-by-side for PDF */
        .bill-content.printing .prescription-body {
          flex-direction: row !important;
        }
        .bill-content.printing .prescription-left {
          flex: 0 0 68% !important;
          max-width: 68% !important;
          overflow: visible !important;
        }
        .bill-content.printing .prescription-right {
          flex: 0 0 32% !important;
          max-width: 32% !important;
          padding-left: 6px !important;
          border-left: 1px solid #e2e8f0 !important;
          border-top: none !important;
          padding-top: 0 !important;
        }

        /* Lab results grid */
        .bill-content.printing .lab-results-grid {
          grid-template-columns: 1fr !important;
          gap: 0px 3px !important;
        }
        .bill-content.printing .lab-results-grid strong {
          font-size: 4.5pt !important;
        }
        .bill-content.printing .lab-results-grid span {
          font-size: 4.5pt !important;
        }
        .bill-content.printing .lab-results-grid .lab-children-row span {
          font-size: 4pt !important;
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


      {/* Invoice Preview */}
      {activeTab === 'details' && (
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
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
                  {checkup.paid !== false && (
                    <div className="text-center mb-1 paid-stamp" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <img src={paidStampImg} alt="PAID" style={{ height: 'clamp(60px, 12vw, 100px)', opacity: 0.85 }} />
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      {/* Prescription Tab */}
      {activeTab === 'prescription' && (
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
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
                                return generalTestFields.map(({ key, label, display, notation, rules, children }) => {
                                  const val = checkup.generalTests?.[key]
                                  const childrenHaveValues = children?.some(({ key: ck }) => checkup.generalTests?.[ck])
                                  const parentShouldShow = shouldShow(display, val) || childrenHaveValues ||
                                    children?.some(({ key: ck, display: cd }) => shouldShow(cd, checkup.generalTests?.[ck]))
                                  if (!children && !shouldShow(display, val)) return null
                                  if (children && !parentShouldShow) return null
                                  const ruleResult = applyRules(val, rules, notation)

                                  return children ? (
                                    <div key={key} style={{ gridColumn: '1 / -1' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minHeight: '20px' }}>
                                        <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', whiteSpace: 'nowrap' }}>{label}:</strong>
                                        <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)' }}>{val || emptyText(display)}</span>
                                        {ruleResult.text && <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', marginLeft: '2px', ...ruleResult.labelStyle }}>{ruleResult.text}</span>}
                                      </div>
                                      <div className="lab-children-row" style={{ display: 'flex', gap: '6px', paddingLeft: '0.5rem', marginTop: '1px' }}>
                                        {children.map(({ key: ck, label: cl, display: cd, notation: cn, rules: cr }) => {
                                          const cv = checkup.generalTests?.[ck]
                                          if (!shouldShow(cd, cv)) return null
                                          const childRule = applyRules(cv, cr, cn)
                                          return (
                                            <div key={ck} style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
                                              <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', color: '#64748b', whiteSpace: 'nowrap' }}>{cl}:</span>
                                              <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)' }}>{cv || emptyText(cd)}</span>
                                              {childRule.text && <span style={{ fontSize: 'clamp(0.45rem, 1vw, 0.55rem)', marginLeft: '2px', ...childRule.labelStyle }}>{childRule.text}</span>}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '2px', minHeight: '20px' }}>
                                      <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', whiteSpace: 'nowrap' }}>{label}:</strong>
                                      <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)' }}>{val || emptyText(display)}</span>
                                      {ruleResult.text && <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', marginLeft: '2px', ...ruleResult.labelStyle }}>{ruleResult.text}</span>}
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

                            return labResultFields.map(({ key, label, display, notation, rules, children }) => {
                              const val = checkup.labResults?.[key]
                              const childrenHaveValues = children?.some(({ key: ck }) => checkup.labResults?.[ck])
                              const parentShouldShow = shouldShow(display, val) || childrenHaveValues ||
                                children?.some(({ key: ck, display: cd }) => shouldShow(cd, checkup.labResults?.[ck]))
                              if (!children && !shouldShow(display, val)) return null
                              if (children && !parentShouldShow) return null
                              const ruleResult = applyRules(val, rules, notation)

                              return children ? (
                                <div key={key} style={{ gridColumn: '1 / -1' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minHeight: '20px' }}>
                                    <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', whiteSpace: 'nowrap' }}>{label}:</strong>
                                    <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)' }}>{val || emptyText(display)}</span>
                                    {ruleResult.text && <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', marginLeft: '2px', ...ruleResult.labelStyle }}>{ruleResult.text}</span>}
                                  </div>
                                  <div className="lab-children-row" style={{ display: 'flex', gap: '6px', paddingLeft: '0.5rem', marginTop: '1px' }}>
                                    {children.map(({ key: ck, label: cl, display: cd, notation: cn, rules: cr }) => {
                                      const cv = checkup.labResults?.[ck]
                                      if (!shouldShow(cd, cv)) return null
                                      const childRule = applyRules(cv, cr, cn)
                                      return (
                                        <div key={ck} style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
                                          <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', color: '#64748b', whiteSpace: 'nowrap' }}>{cl}:</span>
                                          <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)' }}>{cv || emptyText(cd)}</span>
                                          {childRule.text && <span style={{ fontSize: 'clamp(0.45rem, 1vw, 0.55rem)', marginLeft: '2px', ...childRule.labelStyle }}>{childRule.text}</span>}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '2px', minHeight: '20px' }}>
                                  <strong style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', whiteSpace: 'nowrap' }}>{label}:</strong>
                                  <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)' }}>{val || emptyText(display)}</span>
                                  {ruleResult.text && <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', marginLeft: '2px', ...ruleResult.labelStyle }}>{ruleResult.text}</span>}
                                </div>
                              )
                            })
                          })()}
                        </div>

                        {/* Asiri Logo */}
                        <div className="text-center mt-auto pt-2">
                          <img src={asiriLogo} alt="ASIRI Laboratories" className="template-logo-asiri" style={{ height: 'clamp(18px, 3vw, 28px)', objectFit: 'contain', opacity: 0.8 }} />
                        </div>
                      </div>
                    </div>

                    {/* Date / Valid Days / Signature lines */}
                    <div className="date-signature-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '1rem' }}>
                      <div>
                        <p style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', marginBottom: '0.15rem', color: '#333' }}>{new Date().toLocaleDateString()}</p>
                        <div className="sig-line" style={{ borderTop: '1px solid #64748b', width: 'clamp(80px, 15vw, 120px)', marginBottom: '0.25rem' }} />
                        <p style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', marginBottom: 0 }}>Date</p>
                      </div>
                      {(checkup.validDays || settings?.checkupPdf?.defaultValidDays) && (
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 'clamp(0.5rem, 1.3vw, 0.6rem)', color: '#dc2626', fontStyle: 'italic', marginBottom: 0 }}>
                            This prescription is only valid for {checkup.validDays || settings?.checkupPdf?.defaultValidDays || 30} days
                          </p>
                        </div>
                      )}
                      <div style={{ textAlign: 'center' }}>
                        {checkup.useESign !== false && settings?.checkupPdf?.eSign && (
                          <img src={settings.checkupPdf.eSign} alt="Signature" className="esign-img" style={{ height: 'clamp(30px, 6vw, 50px)', objectFit: 'contain', marginBottom: '0.15rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                        )}
                        <div className="sig-line" style={{ borderTop: '1px solid #64748b', width: 'clamp(80px, 15vw, 120px)', marginBottom: '0.25rem', marginLeft: 'auto', marginRight: 'auto' }} />
                        <p style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', marginBottom: 0 }}>Signature</p>
                      </div>
                    </div>
                  </>,
                  'prescription'
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      </div>
    </Container>
  )
}

export default CheckupDetail
