import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const generateCheckupPDF = (checkup, patient, tests) => {
  const doc = new jsPDF()

  // Header
  doc.setFillColor(13, 110, 253) // Bootstrap primary blue
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('Blood Lab Manager', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.text('Point of Sale System', 105, 30, { align: 'center' })

  // Patient Information
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.text('Checkup Bill / Invoice', 14, 55)

  doc.setFontSize(10)
  doc.text(`Bill ID: #${checkup.id}`, 14, 65)
  doc.text(`Date: ${new Date(checkup.timestamp).toLocaleString()}`, 14, 72)

  doc.text(`Patient ID: ${patient.id}`, 120, 65)
  doc.text(`Patient Name: ${patient.name}`, 120, 72)
  doc.text(`Age: ${patient.age} | Gender: ${patient.gender}`, 120, 79)
  doc.text(`Mobile: ${patient.mobile}`, 120, 86)

  // Tests Table
  const testData = checkup.tests.map(testId => {
    const test = tests.find(t => t.id === testId)
    return [test.name, `₹${test.price.toFixed(2)}`]
  })

  doc.autoTable({
    startY: 95,
    head: [['Test Name', 'Price']],
    body: testData,
    theme: 'striped',
    headStyles: { fillColor: [13, 110, 253] },
    foot: [['Total Amount', `₹${checkup.total.toFixed(2)}`]],
    footStyles: { fillColor: [13, 110, 253], textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  // Notes
  if (checkup.notes) {
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text('Notes:', 14, finalY)
    doc.setFontSize(10)
    doc.text(checkup.notes, 14, finalY + 7, { maxWidth: 180 })
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Thank you for choosing Blood Lab Manager', 105, pageHeight - 20, { align: 'center' })
  doc.text('For queries, contact: info@bloodlab.com | +91-1234567890', 105, pageHeight - 15, { align: 'center' })

  // Save PDF
  doc.save(`Checkup_Bill_${checkup.id}_${patient.name}.pdf`)
}
