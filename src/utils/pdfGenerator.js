import jsPDF from 'jspdf'
import 'jspdf-autotable'

// PDF Configuration Constants
const PDF_CONFIG = {
  colors: {
    primary: [8, 145, 178], // Professional cyan/teal
    white: [255, 255, 255],
    black: [0, 0, 0],
    grey: [128, 128, 128],
  },
  header: {
    height: 40,
    titleSize: 24,
    subtitleSize: 12,
  },
  contact: {
    email: 'info@bloodlab.com',
    phone: '+91-1234567890',
  },
}

/**
 * Add PDF header with branding
 */
const addHeader = (doc) => {
  doc.setFillColor(...PDF_CONFIG.colors.primary)
  doc.rect(0, 0, 210, PDF_CONFIG.header.height, 'F')

  doc.setTextColor(...PDF_CONFIG.colors.white)
  doc.setFontSize(PDF_CONFIG.header.titleSize)
  doc.text('Blood Lab Manager', 105, 20, { align: 'center' })

  doc.setFontSize(PDF_CONFIG.header.subtitleSize)
  doc.text('Point of Sale System', 105, 30, { align: 'center' })
}

/**
 * Add patient and bill information
 */
const addBillInfo = (doc, checkup, patient) => {
  doc.setTextColor(...PDF_CONFIG.colors.black)
  doc.setFontSize(16)
  doc.text('Checkup Bill / Invoice', 14, 55)

  doc.setFontSize(10)
  // Left column
  doc.text(`Bill ID: #${checkup.id}`, 14, 65)
  doc.text(`Date: ${new Date(checkup.timestamp).toLocaleString()}`, 14, 72)

  // Right column
  doc.text(`Patient ID: ${patient.id}`, 120, 65)
  doc.text(`Patient Name: ${patient.name}`, 120, 72)
  doc.text(`Age: ${patient.age} | Gender: ${patient.gender}`, 120, 79)
  doc.text(`Mobile: ${patient.mobile}`, 120, 86)
}

/**
 * Add tests table
 */
const addTestsTable = (doc, checkup, tests) => {
  const testData = checkup.tests.map(testItem => {
    const test = tests.find(t => t.id === testItem.testId)

    if (test) {
      return [
        test.name,
        `Rs. ${test.price.toFixed(2)}`,
        testItem.notes || '-'
      ]
    }
    return ['Unknown Test', 'Rs. 0.00', '-']
  })

  doc.autoTable({
    startY: 95,
    head: [['Test Name', 'Price', 'Test Notes']],
    body: testData,
    theme: 'striped',
    headStyles: { fillColor: PDF_CONFIG.colors.primary },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 90 }
    },
    foot: [['Total Amount', `Rs. ${checkup.total.toFixed(2)}`, '']],
    footStyles: {
      fillColor: PDF_CONFIG.colors.primary,
      textColor: PDF_CONFIG.colors.white,
      fontStyle: 'bold'
    }
  })
}

/**
 * Add notes section if present
 */
const addNotes = (doc, checkup) => {
  if (checkup.notes) {
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text('Notes:', 14, finalY)
    doc.setFontSize(10)
    doc.text(checkup.notes, 14, finalY + 7, { maxWidth: 180 })
  }
}

/**
 * Add footer with contact information
 */
const addFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(...PDF_CONFIG.colors.grey)
  doc.text('Thank you for choosing Blood Lab Manager', 105, pageHeight - 20, { align: 'center' })
  doc.text(
    `For queries, contact: ${PDF_CONFIG.contact.email} | ${PDF_CONFIG.contact.phone}`,
    105,
    pageHeight - 15,
    { align: 'center' }
  )
}

/**
 * Generate and download checkup PDF bill
 * @param {Object} checkup - Checkup data
 * @param {Object} patient - Patient data
 * @param {Array} tests - Array of all available tests
 */
export const generateCheckupPDF = (checkup, patient, tests) => {
  const doc = new jsPDF()

  // Build PDF sections
  addHeader(doc)
  addBillInfo(doc, checkup, patient)
  addTestsTable(doc, checkup, tests)
  addNotes(doc, checkup)
  addFooter(doc)

  // Generate filename and save
  const filename = `Checkup_Bill_${checkup.id}_${patient.name.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}

/**
 * Generate PDF preview (returns blob instead of downloading)
 * @param {Object} checkup - Checkup data
 * @param {Object} patient - Patient data
 * @param {Array} tests - Array of all available tests
 * @returns {Blob} PDF as blob
 */
export const generateCheckupPDFBlob = (checkup, patient, tests) => {
  const doc = new jsPDF()

  addHeader(doc)
  addBillInfo(doc, checkup, patient)
  addTestsTable(doc, checkup, tests)
  addNotes(doc, checkup)
  addFooter(doc)

  return doc.output('blob')
}
