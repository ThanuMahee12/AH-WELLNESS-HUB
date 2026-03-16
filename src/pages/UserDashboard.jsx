import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, Badge } from 'react-bootstrap'
import {
  FaUserInjured, FaClipboardCheck, FaFlask, FaUser, FaEnvelope,
  FaPhone, FaShieldAlt, FaCalendarAlt, FaEye, FaHistory, FaClock,
  FaChevronRight, FaFileMedical,
} from 'react-icons/fa'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { fetchCheckups, selectAllCheckups } from '../store/checkupsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { fetchUsers, selectAllUsers } from '../store/usersSlice'
import { getUserActivities } from '../services/activityService'
import LoadingSpinner from '../components/common/LoadingSpinner'

function UserDashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const allUsers = useSelector(selectAllUsers)
  const patients = useSelector(selectAllPatients)
  const checkups = useSelector(selectAllCheckups)
  const tests = useSelector(selectAllTests)
  const { loading: pLoading } = useSelector(state => state.patients)
  const { loading: cLoading } = useSelector(state => state.checkups)

  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState(null)

  useEffect(() => {
    dispatch(fetchPatients())
    dispatch(fetchCheckups())
    dispatch(fetchTests())
    dispatch(fetchUsers())
  }, [dispatch])

  // Load user's own activities
  useEffect(() => {
    if (user?.uid) {
      setActivitiesLoading(true)
      getUserActivities({ userId: user.uid, days: 30 })
        .then(result => { if (result.success) setActivities(result.data.slice(0, 20)) })
        .catch(() => {})
        .finally(() => setActivitiesLoading(false))
    }
  }, [user?.uid])

  // Get linked patient IDs from users entity (more up-to-date than auth user)
  const linkedPatientIds = useMemo(() => {
    const userEntity = allUsers.find(u => u.id === user?.uid)
    return userEntity?.linkedPatients || user?.linkedPatients || []
  }, [allUsers, user?.uid, user?.linkedPatients])

  const myPatients = useMemo(() =>
    patients.filter(p => linkedPatientIds.includes(p.id)),
    [patients, linkedPatientIds]
  )

  const myCheckups = useMemo(() =>
    checkups.filter(c => linkedPatientIds.includes(c.patientId)),
    [checkups, linkedPatientIds]
  )

  // Selected patient's checkups
  const selectedPatient = selectedPatientId ? myPatients.find(p => p.id === selectedPatientId) : null
  const selectedCheckups = useMemo(() => {
    if (!selectedPatientId) return myCheckups
    return myCheckups.filter(c => c.patientId === selectedPatientId)
  }, [myCheckups, selectedPatientId])

  // Stats
  const totalTests = useMemo(() => {
    const testIds = new Set()
    myCheckups.forEach(c => (c.tests || []).forEach(t => testIds.add(t.testId)))
    return testIds.size
  }, [myCheckups])

  const recentCheckups = useMemo(() =>
    [...selectedCheckups].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 10),
    [selectedCheckups]
  )

  const loading = pLoading || cLoading

  if (loading && myPatients.length === 0) {
    return <LoadingSpinner text="Loading your dashboard..." />
  }

  const formatDate = (ts) => {
    if (!ts) return '-'
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getTestNames = (checkup) => {
    return (checkup.tests || []).map(t => {
      const test = tests.find(tt => tt.id === t.testId)
      return test?.name || t.testId
    }).join(', ')
  }

  const activityIcon = (type) => {
    if (type?.includes('checkup')) return <FaClipboardCheck size={10} />
    if (type?.includes('patient')) return <FaUserInjured size={10} />
    if (type?.includes('login') || type?.includes('logout')) return <FaUser size={10} />
    if (type?.includes('pdf')) return <FaFileMedical size={10} />
    return <FaHistory size={10} />
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="g-3">
        {/* ===== LEFT COLUMN (70%) ===== */}
        <Col xs={12} lg={8}>
          {/* Stats Row */}
          <Row className="g-3 mb-3">
            <Col xs={6} md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center gap-3 py-3">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(8,145,178,0.1), rgba(6,182,212,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FaUserInjured style={{ color: '#0891B2', fontSize: '1.1rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{myPatients.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>My Patients</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center gap-3 py-3">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FaClipboardCheck style={{ color: '#10b981', fontSize: '1.1rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{myCheckups.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Total Checkups</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center gap-3 py-3">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FaFlask style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalTests}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Tests Done</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* My Patients */}
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  <FaUserInjured className="me-2" style={{ color: '#0891B2' }} />
                  My Patients
                </h6>
                {selectedPatientId && (
                  <button onClick={() => setSelectedPatientId(null)} style={{ fontSize: '0.75rem', color: '#0891B2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Show All
                  </button>
                )}
              </div>
              {myPatients.length === 0 ? (
                <div className="text-center py-4" style={{ color: '#94a3b8' }}>
                  <FaUserInjured size={32} className="mb-2 opacity-50" />
                  <p style={{ fontSize: '0.85rem' }}>No patients linked to your account yet.</p>
                  <p style={{ fontSize: '0.75rem' }}>Contact an administrator to link your patients.</p>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {myPatients.map(p => {
                    const isSelected = selectedPatientId === p.id
                    const pCheckups = myCheckups.filter(c => c.patientId === p.id)
                    return (
                      <div key={p.id} onClick={() => setSelectedPatientId(isSelected ? null : p.id)}
                        style={{
                          padding: '10px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                          background: isSelected ? 'linear-gradient(135deg, #0891B2, #06B6D4)' : '#f8fafc',
                          color: isSelected ? '#fff' : '#1e293b',
                          border: `1px solid ${isSelected ? '#0891B2' : '#e2e8f0'}`,
                          minWidth: 140,
                        }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                          {p.age ? `${p.age}yr` : ''} {p.gender ? `| ${p.gender}` : ''}
                        </div>
                        <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: 2 }}>
                          {pCheckups.length} checkup{pCheckups.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Recent Checkups */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                <FaClipboardCheck className="me-2" style={{ color: '#10b981' }} />
                {selectedPatient ? `Checkups for ${selectedPatient.name}` : 'Recent Checkups'}
              </h6>
              {recentCheckups.length === 0 ? (
                <div className="text-center py-3" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  No checkups found.
                </div>
              ) : (
                <div>
                  {/* Header */}
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
                      <Link key={c.id} to={`/checkups/${c.id}/details`} className="text-decoration-none"
                        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', padding: '10px 8px', borderBottom: '1px solid #f1f5f9', color: '#1e293b', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ width: 80, fontSize: '0.78rem', color: '#64748b' }}>
                          <FaCalendarAlt size={9} className="me-1 opacity-50" />{formatDate(c.timestamp)}
                        </span>
                        <span style={{ width: 70, fontWeight: 600, fontSize: '0.82rem' }}>#{c.billNo || c.id?.slice(-4)}</span>
                        {!selectedPatientId && <span style={{ width: 120, fontSize: '0.8rem' }}>{pat?.name || '-'}</span>}
                        <span style={{ flex: 1, fontSize: '0.78rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getTestNames(c)}
                        </span>
                        <span style={{ width: 80, textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                          Rs. {(c.total || 0).toLocaleString()}
                        </span>
                        <span style={{ width: 30, textAlign: 'center' }}>
                          <FaEye size={11} style={{ color: '#94a3b8' }} />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
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
              <h6 style={{ fontWeight: 700, marginTop: 8, marginBottom: 2, color: '#0f172a' }}>{user?.username || 'User'}</h6>
              <Badge bg="info" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }}>{user?.role || 'user'}</Badge>

              <div className="mt-3" style={{ fontSize: '0.8rem' }}>
                {user?.email && (
                  <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#475569' }}>
                    <FaEnvelope size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
                  </div>
                )}
                {user?.mobile && (
                  <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#475569' }}>
                    <FaPhone size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <span>{user.mobile}</span>
                  </div>
                )}
                <div className="d-flex align-items-center gap-2" style={{ color: '#475569' }}>
                  <FaShieldAlt size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <span style={{ textTransform: 'capitalize' }}>{user?.role || 'user'}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Summary */}
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-3">
              <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                <FaClipboardCheck className="me-2" style={{ color: '#0891B2' }} />
                Quick Summary
              </h6>
              <div style={{ fontSize: '0.82rem' }}>
                {[
                  { label: 'Linked Patients', value: myPatients.length, color: '#0891B2' },
                  { label: 'Total Checkups', value: myCheckups.length, color: '#10b981' },
                  { label: 'Total Tests', value: totalTests, color: '#f59e0b' },
                  { label: 'This Month', value: myCheckups.filter(c => { const d = new Date(c.timestamp); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length, color: '#8b5cf6' },
                ].map((item, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ color: '#64748b' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                <FaHistory className="me-2" style={{ color: '#64748b' }} />
                My Activity
              </h6>
              {activitiesLoading ? (
                <div className="text-center py-2" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Loading...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-2" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No recent activity.</div>
              ) : (
                <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                  {activities.map((a, i) => (
                    <div key={a.id || i} className="d-flex gap-2 py-2" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.75rem' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#64748b' }}>
                        {activityIcon(a.activityType)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.description}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                          <FaClock size={8} className="me-1" />
                          {formatDate(a.timestamp)} {formatTime(a.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default UserDashboard
