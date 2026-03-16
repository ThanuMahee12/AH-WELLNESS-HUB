import { useEffect, useMemo, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, Badge, Form, Modal } from 'react-bootstrap'
import {
  FaUserInjured, FaClipboardCheck, FaFlask, FaUser, FaEnvelope,
  FaPhone, FaCalendarAlt, FaEye, FaChartBar,
  FaPlus, FaCheck, FaClock, FaBan, FaEdit, FaTrash,
} from 'react-icons/fa'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { fetchCheckups, selectAllCheckups } from '../store/checkupsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { fetchUsers, selectAllUsers } from '../store/usersSlice'
import { firestoreService } from '../services/firestoreService'
import { notifyAppointmentCreated } from '../services/notificationService'
import { useSettings } from '../hooks/useSettings'
import { useNotification } from '../context'
import LoadingSpinner from '../components/common/LoadingSpinner'

const STATUS_STYLES = {
  pending: { color: '#d97706', icon: FaClock, label: 'Pending' },
  approved: { color: '#16a34a', icon: FaCheck, label: 'Approved' },
  rejected: { color: '#dc2626', icon: FaBan, label: 'Rejected' },
}

function UserDashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const allUsers = useSelector(selectAllUsers)
  const patients = useSelector(selectAllPatients)
  const checkups = useSelector(selectAllCheckups)
  const tests = useSelector(selectAllTests)
  const { loading: pLoading } = useSelector(state => state.patients)
  const { loading: cLoading } = useSelector(state => state.checkups)
  const { success: showSuccess, error: showError, confirm } = useNotification()
  const { settings } = useSettings()

  const [selectedPatientId, setSelectedPatientId] = useState(null)

  // Appointment state
  const [appointments, setAppointments] = useState([])
  const [apptLoading, setApptLoading] = useState(true)
  const [showApptForm, setShowApptForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingApptId, setEditingApptId] = useState(null)
  const [apptForm, setApptForm] = useState({ isOwn: true, patientName: '', patientMobile: '', patientAge: '', patientGender: '', expectedDate: '', tests: '', notes: '' })

  useEffect(() => {
    dispatch(fetchPatients())
    dispatch(fetchCheckups())
    dispatch(fetchTests())
    dispatch(fetchUsers())
  }, [dispatch])

  // Load user's appointments only
  const loadAppointments = useCallback(async () => {
    if (!user?.uid) return
    setApptLoading(true)
    try {
      const result = await firestoreService.getAppointmentsByUser(user.uid)
      if (result.success) {
        setAppointments(result.data)
      } else {
        console.warn('Failed to load appointments:', result.error)
        // Fallback: try without orderBy (index may not be ready)
        try {
          const { getDocs, collection, query, where } = await import('firebase/firestore')
          const { db } = await import('../config/firebase')
          const q = query(collection(db, 'appointments'), where('userId', '==', user.uid))
          const snap = await getDocs(q)
          setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
        } catch (fallbackErr) {
          console.warn('Fallback query also failed:', fallbackErr.message)
        }
      }
    } catch (err) {
      console.warn('Appointment load error:', err.message)
    }
    finally { setApptLoading(false) }
  }, [user?.uid])

  useEffect(() => { loadAppointments() }, [loadAppointments])

  // Linked patients
  const linkedPatientIds = useMemo(() => {
    const userEntity = allUsers.find(u => u.id === user?.uid)
    return userEntity?.linkedPatients || user?.linkedPatients || []
  }, [allUsers, user?.uid, user?.linkedPatients])

  const myPatients = useMemo(() => patients.filter(p => linkedPatientIds.includes(p.id)), [patients, linkedPatientIds])
  const myCheckups = useMemo(() => checkups.filter(c => linkedPatientIds.includes(c.patientId)), [checkups, linkedPatientIds])

  const selectedPatient = selectedPatientId ? myPatients.find(p => p.id === selectedPatientId) : null
  const selectedCheckups = useMemo(() => {
    if (!selectedPatientId) return myCheckups
    return myCheckups.filter(c => c.patientId === selectedPatientId)
  }, [myCheckups, selectedPatientId])

  const totalTests = useMemo(() => {
    const ids = new Set()
    myCheckups.forEach(c => (c.tests || []).forEach(t => ids.add(t.testId)))
    return ids.size
  }, [myCheckups])

  const recentCheckups = useMemo(() =>
    [...selectedCheckups].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 10),
    [selectedCheckups]
  )

  const monthlyData = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ name: d.toLocaleDateString('en-US', { month: 'short' }), m: d.getMonth(), y: d.getFullYear(), Checkups: 0, Tests: 0 })
    }
    myCheckups.forEach(c => {
      const d = new Date(c.timestamp)
      const entry = months.find(m => m.m === d.getMonth() && m.y === d.getFullYear())
      if (entry) { entry.Checkups++; entry.Tests += (c.tests || []).length }
    })
    return months
  }, [myCheckups])

  const loading = pLoading || cLoading

  // Test suggestions based on current input
  const testSuggestions = useMemo(() => {
    const val = apptForm.tests?.trim()
    if (!val || val.length < 2) return []
    // Get the last word being typed (after comma)
    const parts = val.split(',')
    const lastPart = parts[parts.length - 1].trim().toLowerCase()
    if (lastPart.length < 2) return []
    return tests.filter(t => t.name?.toLowerCase().includes(lastPart) || t.code?.toLowerCase().includes(lastPart)).slice(0, 5)
  }, [apptForm.tests, tests])

  const addSuggestion = (testName) => {
    const parts = apptForm.tests.split(',').map(s => s.trim()).filter(Boolean)
    parts[parts.length - 1] = testName // replace last partial with full name
    setApptForm(p => ({ ...p, tests: parts.join(', ') + ', ' }))
  }

  // Estimate price from matched test names
  const approxPrice = useMemo(() => {
    if (!apptForm.tests) return 0
    const names = apptForm.tests.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    return names.reduce((sum, name) => {
      const match = tests.find(t => t.name?.toLowerCase() === name)
      return sum + (match?.price || 0)
    }, 0)
  }, [apptForm.tests, tests])

  const resetApptForm = () => {
    setApptForm({ isOwn: true, patientName: '', patientMobile: '', patientAge: '', patientGender: '', expectedDate: '', tests: '', notes: '' })
  }

  const handleSubmitAppointment = async () => {
    if (!apptForm.expectedDate) { showError('Please select a preferred date'); return }
    if (!apptForm.tests.trim()) { showError('Please describe what tests you need'); return }
    if (!apptForm.isOwn && !apptForm.patientName.trim()) { showError('Please enter patient name'); return }

    setSubmitting(true)
    try {
      const data = {
        userId: user.uid,
        isOwn: apptForm.isOwn,
        patient: apptForm.isOwn ? {} : {
          name: apptForm.patientName.trim(),
          mobile: apptForm.patientMobile.trim(),
          age: apptForm.patientAge.trim(),
          gender: apptForm.patientGender,
        },
        expectedDate: apptForm.expectedDate,
        tests: apptForm.tests.split(',').map(s => s.trim()).filter(Boolean),
        approxPrice,
        notes: apptForm.notes.trim(),
        status: 'pending',
      }

      let result
      if (editingApptId) {
        result = await firestoreService.updateAppointment(editingApptId, data)
        if (result.success) showSuccess('Appointment updated!')
      } else {
        result = await firestoreService.createAppointment(data)
        if (result.success) {
          showSuccess('Appointment requested!')
          // Send in-app + external notifications
          const patientName = apptForm.isOwn ? (user?.username || 'Self') : (apptForm.patientName.trim() || 'Unknown')
          notifyAppointmentCreated({ username: user?.username || 'User', patientName, expectedDate: apptForm.expectedDate, tests: data.tests }).catch(() => {})
          const notify = settings?.checkupPdf?.appointmentNotify
          const msg = `New Appointment from ${user?.username || 'User'} for ${patientName} on ${apptForm.expectedDate}. Tests: ${data.tests.join(', ')}`
          if (notify?.whatsapp?.enabled && notify?.whatsapp?.number) {
            const waNum = notify.whatsapp.number.replace(/[^0-9]/g, '')
            window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank')
          }
          if (notify?.email?.enabled && notify?.email?.address) {
            window.open(`mailto:${notify.email.address}?subject=${encodeURIComponent('New Appointment Request')}&body=${encodeURIComponent(msg)}`, '_blank')
          }
        }
      }

      if (result.success) {
        setShowApptForm(false)
        setEditingApptId(null)
        resetApptForm()
        loadAppointments()
      } else {
        showError(result.error || 'Failed')
      }
    } catch (err) { showError(err.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleEditAppointment = (appt) => {
    setEditingApptId(appt.id)
    setApptForm({
      isOwn: appt.isOwn !== false,
      patientName: appt.patient?.name || '',
      patientMobile: appt.patient?.mobile || '',
      patientAge: appt.patient?.age || '',
      patientGender: appt.patient?.gender || '',
      expectedDate: appt.expectedDate || '',
      tests: Array.isArray(appt.tests) ? appt.tests.join(', ') : (appt.tests || ''),
      notes: appt.notes || '',
    })
    setShowApptForm(true)
  }

  const handleDeleteAppointment = async (apptId) => {
    if (!(await confirm('Delete this appointment request?', { title: 'Delete Appointment', variant: 'danger', confirmText: 'Delete' }))) return
    try {
      const result = await firestoreService.deleteAppointment(apptId)
      if (result.success) {
        showSuccess('Appointment deleted')
        loadAppointments()
      } else {
        showError(result.error || 'Failed to delete')
      }
    } catch (err) { showError(err.message || 'Failed') }
  }

  if (loading && myPatients.length === 0 && appointments.length === 0) {
    return <LoadingSpinner text="Loading your dashboard..." />
  }

  const formatDate = (ts) => {
    if (!ts) return '-'
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getTestNames = (checkup) =>
    (checkup.tests || []).map(t => { const test = tests.find(tt => tt.id === t.testId); return test?.name || t.testId }).join(', ')

  const pendingCount = appointments.filter(a => a.status === 'pending').length

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="g-3">
        {/* ===== LEFT COLUMN (70%) ===== */}
        <Col xs={12} lg={8}>
          {/* Stats Row */}
          <Row className="g-3 mb-3">
            {[
              { icon: FaUserInjured, value: myPatients.length, label: 'My Patients', bg: 'rgba(8,145,178,0.1)', color: '#0891B2' },
              { icon: FaClipboardCheck, value: myCheckups.length, label: 'Total Checkups', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
              { icon: FaFlask, value: totalTests, label: 'Tests Done', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
            ].map((s, i) => (
              <Col xs={6} md={4} key={i}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="d-flex align-items-center gap-3 py-3">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <s.icon style={{ color: s.color, fontSize: '1.1rem' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Appointments */}
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  <FaCalendarAlt className="me-2" style={{ color: '#8b5cf6' }} />
                  My Appointments
                  {pendingCount > 0 && <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '0.6rem' }}>{pendingCount} pending</Badge>}
                </h6>
                <button onClick={() => { resetApptForm(); setEditingApptId(null); setShowApptForm(true) }}
                  style={{ fontSize: '0.75rem', padding: '6px 14px', background: 'linear-gradient(135deg, #0891B2, #06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  <FaPlus size={10} className="me-1" />Request Appointment
                </button>
              </div>

              {apptLoading ? (
                <div className="text-center py-3" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Loading...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-4" style={{ color: '#94a3b8' }}>
                  <FaCalendarAlt size={28} className="mb-2 opacity-50" />
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>No appointments yet. Request one to get started.</p>
                </div>
              ) : (
                <div>
                  {appointments.map(a => {
                    const st = STATUS_STYLES[a.status] || STATUS_STYLES.pending
                    const StIcon = st.icon
                    const docFee = settings?.checkupPdf?.defaultDoctorFees || 0
                    const totalEst = (a.approxPrice || 0) + docFee
                    const patName = a.isOwn ? (user?.username || '') : (a.patient?.name || '')
                    const patMobile = a.isOwn ? (user?.mobile || '') : (a.patient?.mobile || '')
                    return (
                      <div key={a.id} className="d-flex align-items-center gap-2 py-2 px-2" style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                        <span style={{ color: st.color, fontSize: '0.72rem', fontWeight: 600, minWidth: 65 }}>
                          <StIcon size={8} className="me-1" />{st.label}
                        </span>
                        {patName && <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.78rem' }}>{patName}</span>}
                        {patMobile && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{patMobile}</span>}
                        {a.expectedDate && <span style={{ color: '#475569', fontSize: '0.75rem' }}><FaCalendarAlt size={8} className="me-1 opacity-50" />{a.expectedDate}</span>}
                        {a.tests && <span style={{ flex: 1, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{Array.isArray(a.tests) ? a.tests.join(', ') : a.tests}</span>}
                        {totalEst > 0 && <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>~Rs.{Math.round(totalEst).toLocaleString()}</span>}
                        {a.status === 'pending' && (
                          <div className="d-flex gap-1" style={{ flexShrink: 0 }}>
                            <button onClick={() => handleEditAppointment(a)} title="Edit"
                              style={{ background: 'none', border: 'none', color: '#0891B2', cursor: 'pointer', padding: '2px 4px' }}>
                              <FaEdit size={11} />
                            </button>
                            <button onClick={() => handleDeleteAppointment(a.id)} title="Delete"
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px 4px' }}>
                              <FaTrash size={10} />
                            </button>
                          </div>
                        )}
                        {a.status === 'approved' && a.checkupId && (
                          <Link to={`/checkups/${a.checkupId}/details`} style={{ fontSize: '0.7rem', color: '#0891B2', fontWeight: 600 }}>
                            <FaEye size={9} className="me-1" />View
                          </Link>
                        )}
                        {a.status === 'rejected' && a.rejectionReason && (
                          <span style={{ fontSize: '0.7rem', color: '#dc2626' }} title={a.rejectionReason}>Reason: {a.rejectionReason}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* My Patients */}
          {myPatients.length > 0 && (
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    <FaUserInjured className="me-2" style={{ color: '#0891B2' }} />My Patients
                  </h6>
                  {selectedPatientId && (
                    <button onClick={() => setSelectedPatientId(null)} style={{ fontSize: '0.75rem', color: '#0891B2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Show All</button>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {myPatients.map(p => {
                    const isSelected = selectedPatientId === p.id
                    const pCheckups = myCheckups.filter(c => c.patientId === p.id)
                    return (
                      <div key={p.id} onClick={() => setSelectedPatientId(isSelected ? null : p.id)}
                        style={{ padding: '10px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                          background: isSelected ? 'linear-gradient(135deg, #0891B2, #06B6D4)' : '#f8fafc',
                          color: isSelected ? '#fff' : '#1e293b', border: `1px solid ${isSelected ? '#0891B2' : '#e2e8f0'}`, minWidth: 140 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{p.age ? `${p.age}yr` : ''} {p.gender ? `| ${p.gender}` : ''}</div>
                        <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: 2 }}>{pCheckups.length} checkup{pCheckups.length !== 1 ? 's' : ''}</div>
                      </div>
                    )
                  })}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Recent Checkups */}
          {recentCheckups.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-3">
                <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  <FaClipboardCheck className="me-2" style={{ color: '#10b981' }} />
                  {selectedPatient ? `Checkups for ${selectedPatient.name}` : 'Recent Checkups'}
                </h6>
                <div className="d-none d-md-flex align-items-center gap-2 py-2 px-2" style={{ fontSize: '0.68rem', color: '#94a3b8', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
                  <span style={{ width: 80 }}>Date</span>
                  <span style={{ width: 70 }}>Bill #</span>
                  {!selectedPatientId && <span style={{ width: 120 }}>Patient</span>}
                  <span style={{ flex: 1 }}>Tests</span>
                  <span style={{ width: 80, textAlign: 'right' }}>Total</span>
                  <span style={{ width: 30 }}></span>
                </div>
                {recentCheckups.map(c => {
                  const pat = patients.find(p => p.id === c.patientId)
                  return (
                    <div key={c.id} className="d-flex flex-wrap align-items-center gap-2 py-2 px-2" style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                      <span style={{ width: 80, fontSize: '0.78rem', color: '#64748b' }}><FaCalendarAlt size={9} className="me-1 opacity-50" />{formatDate(c.timestamp)}</span>
                      <span style={{ width: 70, fontWeight: 600, fontSize: '0.82rem' }}>#{c.billNo || c.id?.slice(-4)}</span>
                      {!selectedPatientId && <span style={{ width: 120, fontSize: '0.8rem' }}>{pat?.name || '-'}</span>}
                      <span style={{ flex: 1, fontSize: '0.78rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTestNames(c)}</span>
                      <span style={{ width: 80, textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Rs. {(c.total || 0).toLocaleString()}</span>
                    </div>
                  )
                })}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* ===== RIGHT COLUMN (30%) ===== */}
        <Col xs={12} lg={4}>
          {/* Profile Card */}
          <Card className="border-0 shadow-sm mb-3" style={{ overflow: 'hidden' }}>
            <div style={{ height: 60, background: 'linear-gradient(135deg, #0891B2, #06B6D4)' }} />
            <Card.Body className="pt-0 px-3 pb-3">
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -28, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <FaUser size={22} style={{ color: '#0891B2' }} />
              </div>
              <h6 style={{ fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#0f172a' }}>{user?.username || 'User'}</h6>
              <div style={{ fontSize: '0.8rem' }}>
                {user?.email && <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#475569' }}><FaEnvelope size={11} style={{ color: '#94a3b8' }} /><span>{user.email}</span></div>}
                {user?.mobile && <div className="d-flex align-items-center gap-2" style={{ color: '#475569' }}><FaPhone size={11} style={{ color: '#94a3b8' }} /><span>{user.mobile}</span></div>}
              </div>
            </Card.Body>
          </Card>

          {/* Quick Summary */}
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-3">
              <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                <FaClipboardCheck className="me-2" style={{ color: '#0891B2' }} />Quick Summary
              </h6>
              <div style={{ fontSize: '0.82rem' }}>
                {[
                  { label: 'Linked Patients', value: myPatients.length, color: '#0891B2' },
                  { label: 'Total Checkups', value: myCheckups.length, color: '#10b981' },
                  { label: 'Pending Appointments', value: pendingCount, color: '#8b5cf6' },
                  { label: 'This Month', value: myCheckups.filter(c => { const d = new Date(c.timestamp); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length, color: '#f59e0b' },
                ].map((item, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ color: '#64748b' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Visit History Chart */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                <FaChartBar className="me-2" style={{ color: '#0891B2' }} />Visit History
              </h6>
              {myCheckups.length === 0 ? (
                <div className="text-center py-3" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No visit data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: '0.8rem' }} cursor={{ fill: 'rgba(8,145,178,0.05)' }} />
                    <Bar dataKey="Checkups" fill="#0891B2" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="Tests" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={16} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== Appointment Request Modal ===== */}
      <Modal show={showApptForm} onHide={() => setShowApptForm(false)} centered fullscreen="md-down">
        <Modal.Header closeButton style={{ border: 'none', paddingBottom: 0 }}>
          <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            <FaCalendarAlt className="me-2" style={{ color: '#8b5cf6' }} />{editingApptId ? 'Edit Appointment' : 'Request Appointment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          {/* Is Own */}
          <div className="mb-3">
            <Form.Check type="switch" id="isOwn" label={<span style={{ fontSize: '0.85rem', fontWeight: 600 }}>This appointment is for myself</span>}
              checked={apptForm.isOwn} onChange={e => setApptForm(p => ({ ...p, isOwn: e.target.checked }))} />
          </div>

          {/* Patient details if not own */}
          {!apptForm.isOwn && (
            <div className="p-3 rounded mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <small className="fw-bold text-muted d-block mb-2" style={{ fontSize: '0.7rem' }}>PATIENT DETAILS</small>
              <Row className="g-2">
                <Col xs={12} md={6}>
                  <Form.Control size="sm" placeholder="Patient Name *" value={apptForm.patientName}
                    onChange={e => setApptForm(p => ({ ...p, patientName: e.target.value }))} />
                </Col>
                <Col xs={6} md={3}>
                  <Form.Control size="sm" placeholder="Age" value={apptForm.patientAge}
                    onChange={e => setApptForm(p => ({ ...p, patientAge: e.target.value }))} />
                </Col>
                <Col xs={6} md={3}>
                  <Form.Select size="sm" value={apptForm.patientGender} onChange={e => setApptForm(p => ({ ...p, patientGender: e.target.value }))}>
                    <option value="">Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </Form.Select>
                </Col>
                <Col xs={12}>
                  <Form.Control size="sm" type="tel" placeholder="Mobile" value={apptForm.patientMobile}
                    onChange={e => setApptForm(p => ({ ...p, patientMobile: e.target.value }))} />
                </Col>
              </Row>
            </div>
          )}

          {/* Expected Date */}
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Preferred Date *</Form.Label>
            <Form.Control type="date" value={apptForm.expectedDate} min={new Date().toISOString().split('T')[0]}
              onChange={e => setApptForm(p => ({ ...p, expectedDate: e.target.value }))} />
          </Form.Group>

          {/* Tests — free text with suggestions */}
          <Form.Group className="mb-3" style={{ position: 'relative' }}>
            <Form.Label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Tests / Keywords *</Form.Label>
            <Form.Control size="sm" placeholder="e.g., blood sugar, TSH, full blood count"
              value={apptForm.tests} onChange={e => setApptForm(p => ({ ...p, tests: e.target.value }))} autoComplete="off" />
            <Form.Text style={{ fontSize: '0.68rem' }} className="text-muted">Type test names or keywords, separated by commas</Form.Text>
            {testSuggestions.length > 0 && (
              <div className="d-flex flex-wrap gap-1 mt-1">
                {testSuggestions.map(t => (
                  <button key={t.id} type="button" onClick={() => addSuggestion(t.name)}
                    style={{ padding: '2px 8px', background: '#f0f9ff', color: '#0e7490', border: '1px solid #bae6fd', borderRadius: 4, fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer' }}>
                    {t.name} {t.price > 0 && <span style={{ color: '#94a3b8' }}>Rs.{t.price}</span>}
                  </button>
                ))}
              </div>
            )}
            {(approxPrice > 0 || (settings?.checkupPdf?.defaultDoctorFees || 0) > 0) && (() => {
              const docFee = settings?.checkupPdf?.defaultDoctorFees || 0
              const total = Math.round(approxPrice + docFee)
              return (
                <div className="mt-2 p-2 rounded" style={{ background: '#f8fafc', fontSize: '0.75rem', color: '#64748b' }}>
                  {approxPrice > 0 && <div>Tests: <strong style={{ color: '#334155' }}>Rs. {approxPrice.toLocaleString()}</strong></div>}
                  {docFee > 0 && <div>Doctor fee: <strong style={{ color: '#334155' }}>Rs. {docFee.toLocaleString()}</strong></div>}
                  {total > 0 && <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 4, marginTop: 4 }}>Estimate: <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>~Rs. {total.toLocaleString()}</strong></div>}
                </div>
              )
            })()}
          </Form.Group>

          {/* Notes */}
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Notes <span className="text-muted fw-normal">(optional)</span></Form.Label>
            <Form.Control as="textarea" rows={2} placeholder="Any special instructions or symptoms..." value={apptForm.notes}
              onChange={e => setApptForm(p => ({ ...p, notes: e.target.value }))} style={{ fontSize: '0.85rem' }} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', paddingTop: 0 }}>
          <button onClick={() => setShowApptForm(false)} style={{ padding: '8px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem' }}>Cancel</button>
          <button onClick={handleSubmitAppointment} disabled={submitting}
            style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #0891B2, #06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Submitting...' : editingApptId ? 'Update' : 'Submit Request'}
          </button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default UserDashboard
