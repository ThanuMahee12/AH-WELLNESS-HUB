import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col, Card, Badge, Modal, Form } from 'react-bootstrap'
import {
  FaCalendarCheck, FaClock, FaCheck, FaBan, FaUser, FaPhone,
  FaCalendarAlt, FaFlask, FaChevronDown, FaChevronUp,
} from 'react-icons/fa'
import { firestoreService } from '../services/firestoreService'
import { useNotification } from '../context'
import LoadingSpinner from '../components/common/LoadingSpinner'

const STATUS_COLOR = { pending: '#d97706', approved: '#16a34a', rejected: '#dc2626' }
const STATUS_ICON = { pending: FaClock, approved: FaCheck, rejected: FaBan }

function Appointments() {
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)
  const { success: showSuccess, error: showError, confirm } = useNotification()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [filter, setFilter] = useState('pending')

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const result = filter === 'pending'
        ? await firestoreService.getPendingAppointments()
        : await firestoreService.getAll('appointments') // fallback for all
      if (result.success) {
        let data = result.data
        if (filter === 'approved') data = data.filter(a => a.status === 'approved')
        if (filter === 'rejected') data = data.filter(a => a.status === 'rejected')
        setAppointments(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAppointments() }, [filter])

  const pendingCount = useMemo(() => appointments.filter(a => a.status === 'pending').length, [appointments])

  const handleApprove = async (appt) => {
    if (!(await confirm(`Approve this appointment and create a checkup?`, { title: 'Approve Appointment', variant: 'success', confirmText: 'Approve & Create Checkup' }))) return

    setProcessing(appt.id)
    try {
      // Navigate to checkup form with appointment data pre-filled
      // Store appointment data in sessionStorage for the checkup form to pick up
      const checkupPrefill = {
        appointmentId: appt.id,
        userId: appt.userId,
        isOwn: appt.isOwn,
        patient: appt.patient || {},
        tests: appt.tests || [],
        notes: appt.notes || '',
        expectedDate: appt.expectedDate || '',
      }
      sessionStorage.setItem('appointmentPrefill', JSON.stringify(checkupPrefill))
      navigate('/checkups/new?fromAppointment=' + appt.id)
    } catch (err) {
      showError(err.message || 'Failed to process')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setProcessing(rejectModal.id)
    try {
      const result = await firestoreService.rejectAppointment(rejectModal.id, rejectReason.trim())
      if (result.success) {
        showSuccess('Appointment rejected')
        setRejectModal(null)
        setRejectReason('')
        loadAppointments()
      } else {
        showError(result.error || 'Failed to reject')
      }
    } catch (err) {
      showError(err.message || 'Failed')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (ts) => {
    if (!ts) return '-'
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateTime = (ts) => {
    if (!ts) return '-'
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Container fluid className="p-3 p-md-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h5 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
          <FaCalendarCheck className="me-2" style={{ color: '#0891B2' }} />
          Appointments
          {pendingCount > 0 && <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '0.65rem' }}>{pendingCount}</Badge>}
        </h5>
        <div className="d-flex gap-1">
          {['pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                fontSize: '0.75rem', padding: '4px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filter === f ? '#0891B2' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b',
                textTransform: 'capitalize',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <FaCalendarCheck size={36} className="mb-3" style={{ color: '#cbd5e1' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No {filter} appointments.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {appointments.map(appt => {
            const isExp = expandedId === appt.id
            const StIcon = STATUS_ICON[appt.status] || FaClock
            const stColor = STATUS_COLOR[appt.status] || '#94a3b8'
            const patientInfo = appt.isOwn ? null : appt.patient

            return (
              <Col xs={12} key={appt.id}>
                <Card className="border-0 shadow-sm" style={{ borderLeft: `3px solid ${stColor}` }}>
                  <Card.Body className="py-2 px-3">
                    {/* Main row */}
                    <div className="d-flex align-items-center gap-2 flex-wrap" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExp ? null : appt.id)}>
                      <StIcon size={12} style={{ color: stColor, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: stColor, fontWeight: 600, minWidth: 65, textTransform: 'capitalize' }}>{appt.status}</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{formatDateTime(appt.createdAt)}</span>
                      {appt.expectedDate && (
                        <span style={{ fontSize: '0.78rem', color: '#334155' }}>
                          <FaCalendarAlt size={9} className="me-1 opacity-50" />{appt.expectedDate}
                        </span>
                      )}
                      {appt.isOwn ? (
                        <Badge bg="info" style={{ fontSize: '0.6rem' }}>Self</Badge>
                      ) : patientInfo?.name ? (
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                          <FaUser size={9} className="me-1" style={{ color: '#94a3b8' }} />{patientInfo.name}
                        </span>
                      ) : null}
                      {appt.tests && (
                        <span style={{ flex: 1, fontSize: '0.78rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <FaFlask size={9} className="me-1" style={{ color: '#94a3b8' }} />
                          {Array.isArray(appt.tests) ? appt.tests.join(', ') : appt.tests}
                        </span>
                      )}
                      {appt.approxPrice > 0 && <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>~Rs.{appt.approxPrice.toLocaleString()}</span>}
                      <span style={{ color: '#94a3b8' }}>{isExp ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}</span>
                    </div>

                    {/* Expanded details */}
                    {isExp && (
                      <div className="mt-2 pt-2" style={{ borderTop: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                        <Row className="g-2">
                          <Col xs={12} md={6}>
                            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, marginBottom: 4 }}>REQUESTER</div>
                            <div style={{ color: '#334155' }}>
                              <span style={{ fontWeight: 600 }}>User ID:</span> {appt.userId}
                            </div>
                            {appt.isOwn && <div style={{ color: '#0891B2', fontSize: '0.75rem' }}>Appointment is for themselves</div>}
                            {!appt.isOwn && patientInfo && (
                              <div className="mt-1" style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 6 }}>
                                <div><strong>Patient:</strong> {patientInfo.name}</div>
                                {patientInfo.age && <div><strong>Age:</strong> {patientInfo.age}</div>}
                                {patientInfo.gender && <div><strong>Gender:</strong> {patientInfo.gender}</div>}
                                {patientInfo.mobile && <div><FaPhone size={9} className="me-1" />{patientInfo.mobile}</div>}
                              </div>
                            )}
                          </Col>
                          <Col xs={12} md={6}>
                            {appt.tests?.length > 0 && (
                              <div className="mb-2">
                                <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, marginBottom: 4 }}>REQUESTED TESTS</div>
                                <div className="d-flex flex-wrap gap-1">
                                  {appt.tests.map((t, i) => (
                                    <span key={i} style={{ padding: '2px 8px', background: '#e0f2fe', color: '#0e7490', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>{t}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {appt.notes && (
                              <div>
                                <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, marginBottom: 4 }}>NOTES</div>
                                <div style={{ color: '#475569', fontSize: '0.78rem' }}>{appt.notes}</div>
                              </div>
                            )}
                          </Col>
                        </Row>

                        {/* Action buttons */}
                        {appt.status === 'pending' && (
                          <div className="d-flex gap-2 mt-3 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                            <button onClick={() => handleApprove(appt)} disabled={processing === appt.id}
                              style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: processing === appt.id ? 0.6 : 1 }}>
                              <FaCheck size={10} className="me-1" />{processing === appt.id ? 'Processing...' : 'Approve & Create Checkup'}
                            </button>
                            <button onClick={() => { setRejectModal(appt); setRejectReason('') }}
                              style={{ padding: '6px 16px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                              <FaBan size={10} className="me-1" />Reject
                            </button>
                          </div>
                        )}

                        {appt.status === 'approved' && appt.checkupId && (
                          <div className="mt-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                            <button onClick={() => navigate(`/checkups/${appt.checkupId}/details`)}
                              style={{ padding: '4px 12px', background: '#f0f9ff', color: '#0891B2', border: '1px solid #bae6fd', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                              View Checkup
                            </button>
                          </div>
                        )}

                        {appt.status === 'rejected' && appt.rejectionReason && (
                          <div className="mt-2 pt-2" style={{ borderTop: '1px solid #f1f5f9', color: '#dc2626', fontSize: '0.78rem' }}>
                            <strong>Rejection reason:</strong> {appt.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      {/* Reject Modal */}
      <Modal show={!!rejectModal} onHide={() => setRejectModal(null)} centered size="sm">
        <Modal.Header closeButton style={{ border: 'none', paddingBottom: 0 }}>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 700 }}>Reject Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Reason (optional)</Form.Label>
            <Form.Control as="textarea" rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Why is this appointment being rejected?" style={{ fontSize: '0.85rem' }} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', paddingTop: 0 }}>
          <button onClick={() => setRejectModal(null)} style={{ padding: '6px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
          <button onClick={handleReject} disabled={processing === rejectModal?.id}
            style={{ padding: '6px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', opacity: processing === rejectModal?.id ? 0.6 : 1 }}>
            {processing === rejectModal?.id ? 'Rejecting...' : 'Reject'}
          </button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Appointments
