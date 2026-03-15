import React, { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Badge, Pagination, Form } from 'react-bootstrap'
import {
  FaCalendarAlt, FaBug, FaTrash, FaSortAmountDown, FaSortAmountUp, FaSync,
  FaChartBar, FaUserInjured, FaClipboardCheck, FaFlask, FaPills, FaUsers,
  FaSignInAlt, FaSignOutAlt, FaCog, FaCommentDots, FaCheck, FaEye, FaReply, FaGithub
} from 'react-icons/fa'
import { useSelector } from 'react-redux'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getErrorLogs, deleteErrorLog, clearAllErrorLogs } from '../services/errorLogService'
import { getUserActivities } from '../services/activityService'
import { getFeedbacks, updateFeedbackStatus, deleteFeedback } from '../services/feedbackService'
import { encrypt, decrypt } from '../utils/crypto'
import { useNotification } from '../context'
import LoadingSpinner from '../components/common/LoadingSpinner'
import PageHeader from '../components/ui/PageHeader'
import DateRangePicker from '../components/ui/DateRangePicker'

const GITHUB_REPO = 'ThanuMahee12/AH-WELLNESS-HUB'

/**
 * Create GitHub issue via API (if token available) or fallback to URL
 */
const createGitHubIssue = async (title, body, labels = [], token) => {
  if (!token) {
    // Fallback: open GitHub pre-filled URL
    const params = new URLSearchParams({ title, body, ...(labels.length > 0 ? { labels: labels.join(',') } : {}) })
    window.open(`https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`, '_blank')
    return { fallback: true }
  }

  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `GitHub API error: ${response.status}`)
  }

  return response.json()
}

function SystemMaintenance() {
  const { user } = useSelector(state => state.auth)
  const { error: showError, success: showSuccess, confirm, info: showInfo } = useNotification()
  const [activeTab, setActiveTab] = useState('daily-report')
  const [githubToken, setGithubToken] = useState('')
  const [tokenLoaded, setTokenLoaded] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [creatingIssue, setCreatingIssue] = useState(null)
  const [createdIssues, setCreatedIssues] = useState({}) // { id: { number, url } }

  // Error logs state
  const [logsLoading, setLogsLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [logsTimeRange, setLogsTimeRange] = useState('all')
  const [logsCustomDates, setLogsCustomDates] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [logsPerPage, setLogsPerPage] = useState(20)
  const [sortField, setSortField] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState('desc')
  const [expandedLog, setExpandedLog] = useState(null)

  // Daily report state
  const [reportLoading, setReportLoading] = useState(false)
  const [dailyReports, setDailyReports] = useState([])
  const [reportDays, setReportDays] = useState(7)
  const [reportCustomDates, setReportCustomDates] = useState({})
  const [expandedDay, setExpandedDay] = useState(null)

  // Complaints state
  const [complaintsLoading, setComplaintsLoading] = useState(false)
  const [complaints, setComplaints] = useState([])
  const [complaintFilter, setComplaintFilter] = useState('all')
  const [expandedComplaint, setExpandedComplaint] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)

  // Load GitHub token from Firestore user doc
  useEffect(() => {
    const loadToken = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const encryptedToken = userDoc.data()?.githubToken
        if (encryptedToken) {
          const decrypted = await decrypt(encryptedToken, user.uid)
          setGithubToken(decrypted)
        }
      } catch (err) {
        // Token not set or decryption failed — ignore
      } finally {
        setTokenLoaded(true)
      }
    }
    if (user?.uid) loadToken()
  }, [user?.uid])

  // Load error logs
  useEffect(() => {
    if (activeTab === 'error-logs') loadLogs()
  }, [logsTimeRange, logsCustomDates, activeTab])

  // Load daily report
  useEffect(() => {
    if (activeTab === 'daily-report') loadDailyReport()
  }, [reportDays, reportCustomDates, activeTab])

  // Load complaints
  useEffect(() => {
    if (activeTab === 'complaints') loadComplaints()
  }, [activeTab])

  useEffect(() => {
    setCurrentPage(1)
  }, [logsTimeRange, logsPerPage, sortField, sortOrder])

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const days = logsTimeRange === 'custom' ? 'all' : logsTimeRange
      const result = await getErrorLogs(days)
      if (result.success) {
        let data = result.data
        if (logsTimeRange === 'custom' && logsCustomDates.startDate && logsCustomDates.endDate) {
          const start = new Date(logsCustomDates.startDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(logsCustomDates.endDate)
          end.setHours(23, 59, 59, 999)
          data = data.filter(l => {
            const d = new Date(l.timestamp)
            return d >= start && d <= end
          })
        }
        setLogs(data)
      } else {
        showError('Failed to load error logs')
      }
    } catch (err) {
      showError('Failed to load error logs')
    } finally {
      setLogsLoading(false)
    }
  }

  const loadDailyReport = async () => {
    setReportLoading(true)
    try {
      const days = reportDays === 'custom' ? 'all' : reportDays
      const result = await getUserActivities({ days })
      if (!result.success) {
        showError('Failed to load activity data')
        return
      }

      let activities = result.data
      if (reportDays === 'custom' && reportCustomDates.startDate && reportCustomDates.endDate) {
        const start = new Date(reportCustomDates.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(reportCustomDates.endDate)
        end.setHours(23, 59, 59, 999)
        activities = activities.filter(a => {
          const d = new Date(a.timestamp)
          return d >= start && d <= end
        })
      }

      // Group activities by date
      const grouped = {}
      activities.forEach(activity => {
        const date = activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp)
        const dateKey = date.toISOString().split('T')[0]

        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            total: 0,
            byType: {},
            byUser: {},
            logins: 0,
            logouts: 0,
          }
        }

        const day = grouped[dateKey]
        day.total++

        // Count by activity type
        const type = activity.activityType || 'unknown'
        day.byType[type] = (day.byType[type] || 0) + 1

        // Count logins/logouts
        if (type === 'login') day.logins++
        if (type === 'logout') day.logouts++

        // Count by user
        const username = activity.username || 'Unknown'
        if (!day.byUser[username]) {
          day.byUser[username] = { total: 0, types: {} }
        }
        day.byUser[username].total++
        day.byUser[username].types[type] = (day.byUser[username].types[type] || 0) + 1
      })

      // Sort by date descending
      const reports = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))
      setDailyReports(reports)
    } catch (err) {
      showError('Failed to generate daily report')
    } finally {
      setReportLoading(false)
    }
  }

  const loadComplaints = async () => {
    setComplaintsLoading(true)
    try {
      const result = await getFeedbacks()
      if (result.success) {
        setComplaints(result.data)
      } else {
        showError('Failed to load complaints')
      }
    } catch (err) {
      showError('Failed to load complaints')
    } finally {
      setComplaintsLoading(false)
    }
  }

  const filteredComplaints = useMemo(() => {
    if (complaintFilter === 'all') return complaints
    return complaints.filter(c => c.status === complaintFilter)
  }, [complaints, complaintFilter])

  const handleStatusChange = async (feedbackId, status) => {
    const note = status === 'resolved' && replyingTo === feedbackId ? replyText : ''
    const result = await updateFeedbackStatus(feedbackId, status, note)
    if (result.success) {
      showSuccess(`Feedback marked as ${status}`)
      setReplyingTo(null)
      setReplyText('')
      loadComplaints()
    } else {
      showError('Failed to update status')
    }
  }

  const handleReply = async (feedbackId) => {
    if (!replyText.trim()) {
      showError('Please enter a reply')
      return
    }
    const result = await updateFeedbackStatus(feedbackId, 'resolved', replyText.trim())
    if (result.success) {
      showSuccess('Reply sent and marked as resolved')
      setReplyingTo(null)
      setReplyText('')
      loadComplaints()
    } else {
      showError('Failed to send reply')
    }
  }

  const handleDeleteComplaint = async (feedbackId) => {
    const confirmed = await confirm('Delete this feedback?')
    if (!confirmed) return
    const result = await deleteFeedback(feedbackId)
    if (result.success) {
      setComplaints(prev => prev.filter(c => c.id !== feedbackId))
      showSuccess('Feedback deleted')
    } else {
      showError('Failed to delete feedback')
    }
  }

  const saveGithubToken = async (token) => {
    const trimmed = token.trim()
    try {
      if (trimmed) {
        const encrypted = await encrypt(trimmed, user.uid)
        await updateDoc(doc(db, 'users', user.uid), { githubToken: encrypted })
        setGithubToken(trimmed)
        showSuccess('GitHub token saved securely')
      } else {
        await updateDoc(doc(db, 'users', user.uid), { githubToken: '' })
        setGithubToken('')
        showInfo('GitHub token removed')
      }
    } catch (err) {
      showError('Failed to save token: ' + err.message)
    }
    setShowTokenInput(false)
  }

  const createErrorIssue = async (log) => {
    const title = `[Error] ${log.source}: ${log.message.substring(0, 80)}`
    const body = `## Error Report

**Source:** ${log.source}
**URL:** ${log.url || 'N/A'}
**User:** ${log.username || 'N/A'} (${log.userRole || 'N/A'})
**Time:** ${new Date(log.timestamp).toLocaleString()}

### Error Message
\`\`\`
${log.message}
\`\`\`

${log.stack ? `### Stack Trace\n\`\`\`\n${log.stack}\n\`\`\`` : ''}

${log.componentStack ? `### Component Stack\n\`\`\`\n${log.componentStack}\n\`\`\`` : ''}

---
*Auto-generated from System Maintenance*`

    setCreatingIssue(log.id)
    try {
      const result = await createGitHubIssue(title, body, ['bug'], githubToken)
      if (result.fallback) {
        showInfo('Opening GitHub — add a token for direct creation')
      } else {
        setCreatedIssues(prev => ({ ...prev, [log.id]: { number: result.number, url: result.html_url } }))
        showSuccess(`Issue #${result.number} created successfully`)
      }
    } catch (err) {
      showError(`Failed to create issue: ${err.message}`)
    } finally {
      setCreatingIssue(null)
    }
  }

  const createComplaintIssue = async (fb) => {
    const title = `[${fb.category}] ${fb.title}`
    const body = `## User Feedback

**Category:** ${fb.category}
**Status:** ${fb.status}
**Submitted by:** ${fb.username} (${fb.userRole})
**Date:** ${new Date(fb.timestamp).toLocaleString()}

### Message
${fb.message}

${fb.adminNote ? `### Admin Response\n${fb.adminNote}` : ''}

---
*Auto-generated from System Maintenance*`

    setCreatingIssue(fb.id)
    try {
      const result = await createGitHubIssue(title, body, [fb.category === 'bug' ? 'bug' : 'enhancement'], githubToken)
      if (result.fallback) {
        showInfo('Opening GitHub — add a token for direct creation')
      } else {
        setCreatedIssues(prev => ({ ...prev, [fb.id]: { number: result.number, url: result.html_url } }))
        showSuccess(`Issue #${result.number} created successfully`)
      }
    } catch (err) {
      showError(`Failed to create issue: ${err.message}`)
    } finally {
      setCreatingIssue(null)
    }
  }

  // Sort error logs
  const sortedLogs = useMemo(() => {
    const sorted = [...logs]
    sorted.sort((a, b) => {
      let valA, valB
      switch (sortField) {
        case 'timestamp':
          valA = a.timestamp || 0
          valB = b.timestamp || 0
          break
        case 'source':
          valA = (a.source || '').toLowerCase()
          valB = (b.source || '').toLowerCase()
          break
        case 'message':
          valA = (a.message || '').toLowerCase()
          valB = (b.message || '').toLowerCase()
          break
        case 'username':
          valA = (a.username || '').toLowerCase()
          valB = (b.username || '').toLowerCase()
          break
        default:
          valA = a.timestamp || 0
          valB = b.timestamp || 0
      }
      if (sortOrder === 'asc') return valA > valB ? 1 : valA < valB ? -1 : 0
      return valA < valB ? 1 : valA > valB ? -1 : 0
    })
    return sorted
  }, [logs, sortField, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage)
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  )

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortOrder === 'desc'
      ? <FaSortAmountDown className="ms-1" size={12} />
      : <FaSortAmountUp className="ms-1" size={12} />
  }

  const handleDelete = async (logId) => {
    const confirmed = await confirm('Delete this error log?')
    if (!confirmed) return
    const result = await deleteErrorLog(logId)
    if (result.success) {
      setLogs(prev => prev.filter(l => l.id !== logId))
      showSuccess('Log deleted')
    } else {
      showError('Failed to delete log')
    }
  }

  const handleClearAll = async () => {
    const confirmed = await confirm('Clear ALL error logs? This cannot be undone.', {
      title: 'Clear All Logs',
      variant: 'danger',
      confirmText: 'Clear All',
    })
    if (!confirmed) return
    const result = await clearAllErrorLogs()
    if (result.success) {
      setLogs([])
      showSuccess('All logs cleared')
    } else {
      showError('Failed to clear logs')
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  const getSourceBadge = (source) => {
    const variants = {
      ErrorBoundary: 'danger',
      'window.onerror': 'warning',
      unhandledrejection: 'dark',
    }
    return (
      <Badge bg={variants[source] || 'secondary'} style={{ fontSize: '0.7rem' }}>
        {source}
      </Badge>
    )
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Activity type display helpers
  const activityLabels = {
    patient_create: 'Patients Created',
    patient_update: 'Patients Updated',
    patient_delete: 'Patients Deleted',
    patient_view: 'Patients Viewed',
    checkup_create: 'Checkups Created',
    checkup_update: 'Checkups Updated',
    checkup_delete: 'Checkups Deleted',
    checkup_view: 'Checkups Viewed',
    checkup_pdf_invoice: 'Invoices Generated',
    checkup_pdf_prescription: 'Prescriptions Generated',
    test_create: 'Tests Created',
    test_update: 'Tests Updated',
    test_delete: 'Tests Deleted',
    medicine_create: 'Medicines Created',
    medicine_update: 'Medicines Updated',
    medicine_delete: 'Medicines Deleted',
    user_create: 'Users Created',
    user_update: 'Users Updated',
    user_delete: 'Users Deleted',
    user_request_create: 'Role Requests',
    user_request_approve: 'Requests Approved',
    user_request_reject: 'Requests Rejected',
    user_password_reset: 'Password Resets',
    settings_update: 'Settings Updated',
    login: 'Logins',
    logout: 'Logouts',
  }

  const getActivityIcon = (type) => {
    if (type.startsWith('patient')) return <FaUserInjured className="me-1" size={12} />
    if (type.startsWith('checkup')) return <FaClipboardCheck className="me-1" size={12} />
    if (type.startsWith('test')) return <FaFlask className="me-1" size={12} />
    if (type.startsWith('medicine')) return <FaPills className="me-1" size={12} />
    if (type.startsWith('user')) return <FaUsers className="me-1" size={12} />
    if (type === 'login') return <FaSignInAlt className="me-1" size={12} />
    if (type === 'logout') return <FaSignOutAlt className="me-1" size={12} />
    if (type === 'settings_update') return <FaCog className="me-1" size={12} />
    return null
  }

  const getTypeBadgeColor = (type) => {
    if (type.includes('create')) return 'success'
    if (type.includes('update') || type.includes('approve')) return 'primary'
    if (type.includes('delete') || type.includes('reject')) return 'danger'
    if (type.includes('pdf')) return 'info'
    if (type === 'login') return 'success'
    if (type === 'logout') return 'secondary'
    return 'secondary'
  }

  return (
    <div className="p-2 p-md-3 d-flex flex-column" style={{ height: 'calc(100vh - 52px)' }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2 flex-shrink-0">
        <PageHeader title="System Maintenance" subtitle="Reports, complaints & error logs" icon={FaBug} />
        <div className="d-flex align-items-center gap-1">
          {showTokenInput ? (
            <div className="d-flex align-items-center gap-1">
              <Form.Control size="sm" type="password" placeholder="ghp_xxxxx..." defaultValue={githubToken}
                style={{ maxWidth: '180px', width: '100%', fontSize: '0.72rem', height: 26 }}
                onKeyDown={(e) => { if (e.key === 'Enter') saveGithubToken(e.target.value); if (e.key === 'Escape') setShowTokenInput(false) }}
                autoFocus />
              <button type="button" onClick={(e) => saveGithubToken(e.target.closest('.d-flex').querySelector('input').value)}
                style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 3 }}>Save</button>
              <button type="button" onClick={() => setShowTokenInput(false)}
                style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 3 }}>Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowTokenInput(true)}
              title={githubToken ? 'GitHub token configured — click to change' : 'Add GitHub token for direct issue creation'}
              style={{ fontSize: '0.65rem', padding: '2px 10px', backgroundColor: githubToken ? '#f0fdf4' : '#f8f9fa', color: githubToken ? '#16a34a' : '#64748b', border: `1px solid ${githubToken ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 3 }}>
              <FaGithub size={10} className="me-1" />{githubToken ? 'Token Set' : 'GitHub Token'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex-shrink-0 border-bottom mb-0">
        <div className="d-flex gap-0">
          {[
            { key: 'daily-report', label: 'Daily Report', icon: FaChartBar },
            { key: 'complaints', label: 'Complaints', icon: FaCommentDots },
            { key: 'error-logs', label: 'Error Logs', icon: FaBug },
          ].map(tab => (
            <button key={tab.key} type="button"
              className={`btn btn-link text-decoration-none px-3 py-1 ${activeTab === tab.key ? 'fw-semibold' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              style={{ fontSize: '0.72rem', color: activeTab === tab.key ? '#0891B2' : '#94a3b8', borderRadius: 0,
                borderBottom: activeTab === tab.key ? '2px solid #0891B2' : '2px solid transparent' }}>
              <tab.icon className="me-1" size={11} />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: '8px' }}>
          {/* ===== DAILY REPORT TAB ===== */}
          {activeTab === 'daily-report' && (<>
            <Card className="shadow-sm border-0 mb-2">
              <Card.Body className="py-2 px-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <DateRangePicker value={reportDays}
                    onChange={(range, dates) => { setReportDays(range); if (range === 'custom') setReportCustomDates(dates) }}
                    presets={[{ key: 7, label: '7d' }, { key: 14, label: '14d' }, { key: 30, label: '30d' }, { key: 'all', label: 'All' }]} />
                  <button type="button" onClick={loadDailyReport} title="Refresh"
                    style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}><FaSync size={11} /></button>
                </div>
              </Card.Body>
            </Card>

            {reportLoading ? (
              <LoadingSpinner text="Generating daily reports..." />
            ) : dailyReports.length === 0 ? (
              <div className="text-center text-muted py-4" style={{ fontSize: '0.78rem' }}>
                <FaChartBar size={20} className="mb-2 d-block mx-auto" style={{ opacity: 0.3 }} />
                No activity data found for the selected period
              </div>
            ) : (
              <div>
                {dailyReports.map(day => {
                  const isExpanded = expandedDay === day.date
                  const isToday = day.date === new Date().toISOString().split('T')[0]
                  const patientsCreated = day.byType['patient_create'] || 0
                  const checkupsCreated = day.byType['checkup_create'] || 0
                  const invoices = day.byType['checkup_pdf_invoice'] || 0

                  return (
                    <div key={day.date} className="mb-1" style={isToday ? { borderLeft: '3px solid #0891B2', borderRadius: 4 } : {}}>
                      <div className="d-flex justify-content-between align-items-center py-1 px-2"
                        style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0f9fa' : 'transparent', borderBottom: '1px solid #f1f5f9', borderRadius: isExpanded ? '4px 4px 0 0' : 0 }}
                        onClick={() => setExpandedDay(isExpanded ? null : day.date)}>
                        <div className="d-flex align-items-center gap-2">
                          <strong style={{ fontSize: '0.75rem' }}>{formatDate(day.date)}</strong>
                          {isToday && <Badge bg="info" style={{ fontSize: '0.5rem' }}>Today</Badge>}
                        </div>
                        <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.68rem' }}>
                          <Badge bg="secondary" pill style={{ fontSize: '0.55rem' }}>{day.total}</Badge>
                          {patientsCreated > 0 && <span className="text-success d-none d-md-inline"><FaUserInjured size={9} className="me-1" />{patientsCreated}</span>}
                          {checkupsCreated > 0 && <span className="text-primary d-none d-md-inline"><FaClipboardCheck size={9} className="me-1" />{checkupsCreated}</span>}
                          {invoices > 0 && <span className="text-info d-none d-md-inline">{invoices} inv</span>}
                          <span className="text-muted"><FaSignInAlt size={9} className="me-1" />{day.logins}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="py-2 px-2" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRadius: '0 0 4px 4px' }}>
                          <Row className="g-2">
                            <Col md={7}>
                              <small className="fw-bold text-muted d-block mb-1" style={{ fontSize: '0.58rem' }}>ACTIVITY BREAKDOWN</small>
                              {Object.entries(day.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                                <div key={type} className="d-flex justify-content-between align-items-center py-1" style={{ fontSize: '0.72rem', borderBottom: '1px solid #f1f5f9' }}>
                                  <span>{getActivityIcon(type)}{activityLabels[type] || type.replace(/_/g, ' ')}</span>
                                  <Badge bg={getTypeBadgeColor(type)} pill style={{ fontSize: '0.55rem' }}>{count}</Badge>
                                </div>
                              ))}
                            </Col>
                            <Col md={5}>
                              <small className="fw-bold text-muted d-block mb-1" style={{ fontSize: '0.58rem' }}>BY USER</small>
                              {Object.entries(day.byUser).sort((a, b) => b[1].total - a[1].total).map(([username, data]) => (
                                <div key={username} className="d-flex justify-content-between align-items-center py-1" style={{ fontSize: '0.72rem', borderBottom: '1px solid #f1f5f9' }}>
                                  <strong>{username}</strong>
                                  <Badge bg="secondary" pill style={{ fontSize: '0.55rem' }}>{data.total}</Badge>
                                </div>
                              ))}
                            </Col>
                          </Row>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>)}

          {/* ===== COMPLAINTS TAB ===== */}
          {activeTab === 'complaints' && (<>
            <Card className="shadow-sm border-0 mb-2">
              <Card.Body className="py-2 px-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-1 flex-wrap">
                    {[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'reviewed', label: 'Reviewed' }, { value: 'resolved', label: 'Resolved' }].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setComplaintFilter(opt.value)}
                        style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 3, border: `1px solid ${complaintFilter === opt.value ? '#0891B2' : '#e2e8f0'}`,
                          backgroundColor: complaintFilter === opt.value ? '#0891B2' : '#fff', color: complaintFilter === opt.value ? '#fff' : '#64748b' }}>
                        {opt.label}
                        {opt.value !== 'all' && <span className="ms-1" style={{ fontSize: '0.55rem', opacity: 0.8 }}>({complaints.filter(c => c.status === opt.value).length})</span>}
                      </button>
                    ))}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {/* Inline stats */}
                    <div className="d-none d-md-flex align-items-center gap-2" style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                      <span>{complaints.length} total</span>
                      <span className="text-warning">{complaints.filter(c => c.status === 'pending').length} pending</span>
                      <span className="text-success">{complaints.filter(c => c.status === 'resolved').length} resolved</span>
                    </div>
                    <button type="button" onClick={loadComplaints} title="Refresh"
                      style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}><FaSync size={11} /></button>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {complaintsLoading ? (
              <LoadingSpinner text="Loading complaints..." />
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center text-muted py-4" style={{ fontSize: '0.78rem' }}>
                <FaCommentDots size={20} className="mb-2 d-block mx-auto" style={{ opacity: 0.3 }} />
                No complaints found
              </div>
            ) : (
              <div>
                {filteredComplaints.map(fb => {
                  const isExpanded = expandedComplaint === fb.id
                  const catColors = { bug: 'danger', feature: 'primary', improvement: 'info', complaint: 'warning', general: 'secondary' }
                  const statusColors = { pending: 'warning', reviewed: 'info', resolved: 'success' }

                  return (
                    <div key={fb.id} style={fb.status === 'pending' ? { borderLeft: '3px solid #f59e0b', borderRadius: 4 } : {}}>
                      <div className="d-flex justify-content-between align-items-center py-1 px-2"
                        style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0f9fa' : 'transparent', borderBottom: '1px solid #f1f5f9' }}
                        onClick={() => setExpandedComplaint(isExpanded ? null : fb.id)}>
                        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                          <strong>{fb.title}</strong>
                          <Badge bg={catColors[fb.category] || 'secondary'} style={{ fontSize: '0.5rem' }}>{fb.category}</Badge>
                          <Badge bg={statusColors[fb.status] || 'secondary'} style={{ fontSize: '0.5rem' }}>{fb.status}</Badge>
                        </div>
                        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
                          <span className="text-muted">{fb.username}</span>
                          <Badge bg="light" text="dark" style={{ fontSize: '0.5rem' }}>{fb.userRole}</Badge>
                          <small className="text-muted">{new Date(fb.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="py-2 px-3" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <p style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }} className="mb-1">{fb.message}</p>
                          <small className="text-muted d-block mb-2" style={{ fontSize: '0.62rem' }}>
                            {new Date(fb.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </small>

                          {fb.adminNote && (
                            <div className="p-2 rounded mb-2" style={{ backgroundColor: '#f0f9fa', fontSize: '0.72rem' }}>
                              <strong style={{ color: '#0891B2' }}>Response:</strong> {fb.adminNote}
                            </div>
                          )}

                          {replyingTo === fb.id && (
                            <div className="mb-2">
                              <Form.Control as="textarea" rows={2} size="sm" placeholder="Write a reply..." value={replyText}
                                onChange={(e) => setReplyText(e.target.value)} style={{ fontSize: '0.75rem' }} />
                              <div className="d-flex gap-1 mt-1">
                                <button type="button" onClick={() => handleReply(fb.id)}
                                  style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 3 }}>Send & Resolve</button>
                                <button type="button" onClick={() => { setReplyingTo(null); setReplyText('') }}
                                  style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 3 }}>Cancel</button>
                              </div>
                            </div>
                          )}

                          <div className="d-flex gap-1 flex-wrap">
                            {fb.status === 'pending' && (
                              <button type="button" onClick={() => handleStatusChange(fb.id, 'reviewed')}
                                style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#fff', color: '#0891B2', border: '1px solid #0891B2', borderRadius: 3 }}>
                                <FaEye size={8} className="me-1" />Reviewed</button>
                            )}
                            {fb.status !== 'resolved' && (<>
                              <button type="button" onClick={() => handleStatusChange(fb.id, 'resolved')}
                                style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#fff', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 3 }}>
                                <FaCheck size={8} className="me-1" />Resolve</button>
                              <button type="button" onClick={() => { setReplyingTo(fb.id); setReplyText('') }}
                                style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#fff', color: '#0891B2', border: '1px solid #bae6fd', borderRadius: 3 }}>
                                <FaReply size={8} className="me-1" />Reply</button>
                            </>)}
                            {createdIssues[fb.id] ? (
                              <a href={createdIssues[fb.id].url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 3, textDecoration: 'none' }}>
                                <FaGithub size={8} className="me-1" />#{createdIssues[fb.id].number}</a>
                            ) : (
                              <button type="button" disabled={creatingIssue === fb.id} onClick={() => createComplaintIssue(fb)}
                                style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#fff', color: '#333', border: '1px solid #e2e8f0', borderRadius: 3, opacity: creatingIssue === fb.id ? 0.5 : 1 }}>
                                <FaGithub size={8} className="me-1" />{creatingIssue === fb.id ? '...' : 'Issue'}</button>
                            )}
                            <button type="button" onClick={() => handleDeleteComplaint(fb.id)}
                              style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 3 }}>
                              <FaTrash size={8} className="me-1" />Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>)}

          {/* ===== ERROR LOGS TAB ===== */}
          {activeTab === 'error-logs' && (<>
            <Card className="shadow-sm border-0 mb-2">
              <Card.Body className="py-2 px-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <DateRangePicker value={logsTimeRange}
                    onChange={(range, dates) => { setLogsTimeRange(range); if (range === 'custom') setLogsCustomDates(dates) }}
                    presets={[{ key: 'all', label: 'All' }, { key: 1, label: '24h' }, { key: 7, label: '7d' }, { key: 30, label: '30d' }]} />
                  <div className="d-flex align-items-center gap-1">
                    <Form.Select size="sm" value={logsPerPage} onChange={(e) => setLogsPerPage(Number(e.target.value))}
                      style={{ width: 'auto', fontSize: '0.68rem', height: 24, padding: '0 4px' }}>
                      <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                    </Form.Select>
                    <button type="button" onClick={loadLogs} title="Refresh"
                      style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}><FaSync size={11} /></button>
                    {logs.length > 0 && (
                      <button type="button" onClick={handleClearAll} title="Clear all logs"
                        style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 3 }}>
                        <FaTrash size={8} className="me-1" />Clear All
                      </button>
                    )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>

            {/* Inline stats */}
            <div className="d-flex gap-2 mb-2 flex-wrap">
              {[
                { label: 'Total', value: logs.length, color: '#0891B2' },
                { label: 'Crashes', value: logs.filter(l => l.source === 'ErrorBoundary').length, color: '#dc2626' },
                { label: 'Runtime', value: logs.filter(l => l.source === 'window.onerror').length, color: '#f59e0b' },
                { label: 'Promises', value: logs.filter(l => l.source === 'unhandledrejection').length, color: '#333' },
              ].map(s => (
                <div key={s.label} className="text-center px-3 py-1 rounded" style={{ border: '1px solid #e2e8f0', flex: 1, minWidth: 70 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.55rem', color: '#94a3b8' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Error Logs */}
            {logsLoading ? (
              <LoadingSpinner text="Loading error logs..." />
            ) : (
              <Card className="shadow-sm border-0">
                <Card.Body className="py-2 px-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="fw-bold text-muted">ERROR LOGS ({sortedLogs.length})</small>
                  </div>

                  {paginatedLogs.length === 0 ? (
                    <div className="text-center text-muted py-4" style={{ fontSize: '0.78rem' }}>
                      <FaBug size={20} className="mb-2 d-block mx-auto" style={{ opacity: 0.3 }} />
                      No error logs found
                    </div>
                  ) : (
                    <div>
                      {/* Column headers */}
                      <div className="d-none d-md-flex align-items-center gap-1 py-1 px-1 mb-1" style={{ fontSize: '0.55rem', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ width: 130, cursor: 'pointer' }} onClick={() => handleSort('timestamp')}>Time <SortIcon field="timestamp" /></span>
                        <span style={{ width: 90, cursor: 'pointer' }} onClick={() => handleSort('source')}>Source <SortIcon field="source" /></span>
                        <span style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleSort('message')}>Message <SortIcon field="message" /></span>
                        <span style={{ width: 80, cursor: 'pointer' }} onClick={() => handleSort('username')}>User <SortIcon field="username" /></span>
                        <span style={{ width: 24 }}></span>
                      </div>

                      {paginatedLogs.map(log => (
                        <React.Fragment key={log.id}>
                          <div className="d-flex flex-wrap align-items-center gap-1 py-1 px-1"
                            style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.72rem', cursor: 'pointer' }}
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                            <span style={{ width: 130, color: '#94a3b8', fontSize: '0.65rem' }}>{formatTimestamp(log.timestamp)}</span>
                            <span style={{ width: 90 }}>{getSourceBadge(log.source)}</span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</span>
                            <span className="d-none d-md-inline" style={{ width: 80, color: '#64748b', fontSize: '0.65rem' }}>{log.username || '-'}</span>
                            <span style={{ width: 24 }}>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(log.id) }}
                                style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }} aria-label="Delete">
                                <FaTrash size={9} /></button>
                            </span>
                          </div>

                          {expandedLog === log.id && (
                            <div style={{ padding: '8px 8px 8px 28px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem' }}>
                              <div className="mb-1"><strong>URL:</strong> <span className="text-muted">{log.url || 'N/A'}</span></div>
                              <div className="mb-1"><strong>User:</strong> <span className="text-muted">{log.username || 'N/A'} ({log.userRole || 'N/A'})</span></div>
                              {log.stack && (
                                <div className="mb-1">
                                  <strong>Stack Trace:</strong>
                                  <pre style={{ fontSize: '0.62rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 3,
                                    padding: '6px', maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '3px 0 0' }}>
                                    {log.stack}
                                  </pre>
                                </div>
                              )}
                              {log.componentStack && (
                                <div className="mb-1">
                                  <strong>Component Stack:</strong>
                                  <pre style={{ fontSize: '0.62rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 3,
                                    padding: '6px', maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '3px 0 0' }}>
                                    {log.componentStack}
                                  </pre>
                                </div>
                              )}
                              <div className="mt-1">
                                {createdIssues[log.id] ? (
                                  <a href={createdIssues[log.id].url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                    style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 3, textDecoration: 'none' }}>
                                    <FaGithub size={9} className="me-1" />#{createdIssues[log.id].number}</a>
                                ) : (
                                  <button type="button" disabled={creatingIssue === log.id}
                                    onClick={(e) => { e.stopPropagation(); createErrorIssue(log) }}
                                    style={{ fontSize: '0.6rem', padding: '2px 8px', backgroundColor: '#fff', color: '#333', border: '1px solid #e2e8f0', borderRadius: 3, opacity: creatingIssue === log.id ? 0.5 : 1 }}>
                                    <FaGithub size={9} className="me-1" />{creatingIssue === log.id ? 'Creating...' : 'Create Issue'}</button>
                                )}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <small className="text-muted" style={{ fontSize: '0.6rem' }}>
                        {((currentPage - 1) * logsPerPage) + 1}-{Math.min(currentPage * logsPerPage, sortedLogs.length)} of {sortedLogs.length}
                      </small>
                      <Pagination size="sm" className="mb-0">
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2))
                          .map((page, index, array) => {
                            const prevPage = array[index - 1]
                            const showEllipsis = prevPage && page - prevPage > 1
                            return (
                              <span key={page}>
                                {showEllipsis && <Pagination.Ellipsis disabled />}
                                <Pagination.Item active={page === currentPage} onClick={() => setCurrentPage(page)}>{page}</Pagination.Item>
                              </span>
                            )
                          })}
                        <Pagination.Next onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </>)}
      </div>
    </div>
  )
}

export default SystemMaintenance
