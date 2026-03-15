import React, { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Table, Badge, Pagination, Form, Button, ButtonGroup, Tab, Nav } from 'react-bootstrap'
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
    <div className="p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <PageHeader
          title="System Maintenance"
          subtitle="Daily reports and error logs"
          icon={FaBug}
        />
        <div className="d-flex align-items-center gap-2">
          {showTokenInput ? (
            <div className="d-flex align-items-center gap-1">
              <Form.Control
                size="sm"
                type="password"
                placeholder="ghp_xxxxx..."
                defaultValue={githubToken}
                style={{ width: '220px', fontSize: '0.8rem' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveGithubToken(e.target.value)
                  if (e.key === 'Escape') setShowTokenInput(false)
                }}
                autoFocus
              />
              <Button
                size="sm"
                variant="success"
                onClick={(e) => saveGithubToken(e.target.closest('.d-flex').querySelector('input').value)}
                style={{ fontSize: '0.75rem' }}
              >
                Save
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setShowTokenInput(false)} style={{ fontSize: '0.75rem' }}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant={githubToken ? 'outline-success' : 'outline-secondary'}
              onClick={() => setShowTokenInput(true)}
              style={{ fontSize: '0.78rem' }}
              title={githubToken ? 'GitHub token configured — click to change' : 'Add GitHub token for direct issue creation'}
            >
              <FaGithub className="me-1" />
              {githubToken ? 'Token Set' : 'Set GitHub Token'}
            </Button>
          )}
        </div>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="daily-report">
              <FaChartBar className="me-1" /> Daily Report
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="complaints">
              <FaCommentDots className="me-1" /> Complaints
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="error-logs">
              <FaBug className="me-1" /> Error Logs
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* ===== DAILY REPORT TAB ===== */}
          <Tab.Pane eventKey="daily-report">
            {/* Time Range Filter */}
            <Row className="mb-3">
              <Col>
                <Card className="shadow-sm">
                  <Card.Body className="py-2 px-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <DateRangePicker
                        value={reportDays}
                        onChange={(range, dates) => {
                          setReportDays(range)
                          if (range === 'custom') setReportCustomDates(dates)
                        }}
                        presets={[
                          { key: 7, label: '7 Days' },
                          { key: 14, label: '14 Days' },
                          { key: 30, label: '30 Days' },
                          { key: 'all', label: 'All' },
                        ]}
                      />
                      <Button size="sm" variant="outline-secondary" onClick={loadDailyReport} title="Refresh">
                        <FaSync />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {reportLoading ? (
              <LoadingSpinner text="Generating daily reports..." />
            ) : dailyReports.length === 0 ? (
              <Card className="shadow-sm">
                <Card.Body className="text-center text-muted py-4">
                  <FaChartBar size={24} className="mb-2 d-block mx-auto" style={{ opacity: 0.3 }} />
                  <small>No activity data found for the selected period</small>
                </Card.Body>
              </Card>
            ) : (
              <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                {dailyReports.map(day => {
                  const isExpanded = expandedDay === day.date
                  const isToday = day.date === new Date().toISOString().split('T')[0]

                  // Get summary counts for key categories
                  const patientsCreated = day.byType['patient_create'] || 0
                  const checkupsCreated = day.byType['checkup_create'] || 0
                  const invoices = day.byType['checkup_pdf_invoice'] || 0
                  const prescriptions = day.byType['checkup_pdf_prescription'] || 0

                  return (
                    <Card
                      key={day.date}
                      className="shadow-sm mb-2"
                      style={isToday ? { borderLeft: '3px solid #0891B2' } : {}}
                    >
                      <Card.Header
                        className="py-2 px-3"
                        style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0f9fa' : '#f8f9fa' }}
                        onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2">
                            <strong style={{ fontSize: '0.88rem' }}>
                              {formatDate(day.date)}
                              {isToday && <Badge bg="info" className="ms-2" style={{ fontSize: '0.65rem' }}>Today</Badge>}
                            </strong>
                          </div>
                          <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.78rem' }}>
                            <span title="Total Activities">
                              <Badge bg="secondary" pill>{day.total} actions</Badge>
                            </span>
                            {patientsCreated > 0 && (
                              <span className="text-success">
                                <FaUserInjured size={11} className="me-1" />{patientsCreated} patients
                              </span>
                            )}
                            {checkupsCreated > 0 && (
                              <span className="text-primary">
                                <FaClipboardCheck size={11} className="me-1" />{checkupsCreated} checkups
                              </span>
                            )}
                            {invoices > 0 && (
                              <span className="text-info">{invoices} invoices</span>
                            )}
                            {prescriptions > 0 && (
                              <span className="text-info">{prescriptions} prescriptions</span>
                            )}
                            <span className="text-muted">
                              <FaSignInAlt size={11} className="me-1" />{day.logins}
                            </span>
                          </div>
                        </div>
                      </Card.Header>

                      {isExpanded && (
                        <Card.Body className="py-2 px-3">
                          <Row>
                            {/* Activity Breakdown */}
                            <Col md={7}>
                              <small className="fw-bold text-muted d-block mb-1">ACTIVITY BREAKDOWN</small>
                              <Table size="sm" className="mb-0" style={{ fontSize: '0.8rem' }}>
                                <tbody>
                                  {Object.entries(day.byType)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([type, count]) => (
                                      <tr key={type}>
                                        <td style={{ padding: '3px 8px', width: '60%' }}>
                                          {getActivityIcon(type)}
                                          {activityLabels[type] || type.replace(/_/g, ' ')}
                                        </td>
                                        <td style={{ padding: '3px 8px' }}>
                                          <Badge bg={getTypeBadgeColor(type)} pill style={{ fontSize: '0.72rem' }}>
                                            {count}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </Table>
                            </Col>

                            {/* User Breakdown */}
                            <Col md={5}>
                              <small className="fw-bold text-muted d-block mb-1">BY USER</small>
                              <Table size="sm" className="mb-0" style={{ fontSize: '0.8rem' }}>
                                <tbody>
                                  {Object.entries(day.byUser)
                                    .sort((a, b) => b[1].total - a[1].total)
                                    .map(([username, data]) => (
                                      <tr key={username}>
                                        <td style={{ padding: '3px 8px' }}>
                                          <strong>{username}</strong>
                                        </td>
                                        <td style={{ padding: '3px 8px' }}>
                                          <Badge bg="secondary" pill style={{ fontSize: '0.72rem' }}>
                                            {data.total}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </Table>
                            </Col>
                          </Row>
                        </Card.Body>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </Tab.Pane>

          {/* ===== COMPLAINTS TAB ===== */}
          <Tab.Pane eventKey="complaints">
            {/* Filter */}
            <Row className="mb-3">
              <Col>
                <Card className="shadow-sm">
                  <Card.Body className="py-2 px-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <strong style={{ fontSize: '0.85rem' }}>Status:</strong>
                        <ButtonGroup size="sm">
                          {[
                            { value: 'all', label: 'All' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'reviewed', label: 'Reviewed' },
                            { value: 'resolved', label: 'Resolved' },
                          ].map(opt => (
                            <Button
                              key={opt.value}
                              variant={complaintFilter === opt.value ? 'primary' : 'outline-primary'}
                              onClick={() => setComplaintFilter(opt.value)}
                              style={complaintFilter === opt.value
                                ? { backgroundColor: '#0891B2', borderColor: '#0891B2' }
                                : { color: '#0891B2', borderColor: '#0891B2' }}
                            >
                              {opt.label}
                              {opt.value !== 'all' && (
                                <Badge bg="light" text="dark" className="ms-1" style={{ fontSize: '0.65rem' }}>
                                  {complaints.filter(c => c.status === opt.value).length}
                                </Badge>
                              )}
                            </Button>
                          ))}
                        </ButtonGroup>
                      </div>
                      <Button size="sm" variant="outline-secondary" onClick={loadComplaints} title="Refresh">
                        <FaSync />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Stats */}
            <Row className="mb-3">
              <Col xs={6} md={3}>
                <Card className="text-center shadow-sm">
                  <Card.Body className="py-2">
                    <h4 className="mb-0 text-theme">{complaints.length}</h4>
                    <small className="text-muted">Total</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className="text-center shadow-sm">
                  <Card.Body className="py-2">
                    <h4 className="mb-0 text-warning">{complaints.filter(c => c.status === 'pending').length}</h4>
                    <small className="text-muted">Pending</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className="text-center shadow-sm">
                  <Card.Body className="py-2">
                    <h4 className="mb-0 text-info">{complaints.filter(c => c.status === 'reviewed').length}</h4>
                    <small className="text-muted">Reviewed</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className="text-center shadow-sm">
                  <Card.Body className="py-2">
                    <h4 className="mb-0 text-success">{complaints.filter(c => c.status === 'resolved').length}</h4>
                    <small className="text-muted">Resolved</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {complaintsLoading ? (
              <LoadingSpinner text="Loading complaints..." />
            ) : filteredComplaints.length === 0 ? (
              <Card className="shadow-sm">
                <Card.Body className="text-center text-muted py-4">
                  <FaCommentDots size={24} className="mb-2 d-block mx-auto" style={{ opacity: 0.3 }} />
                  <small>No complaints found</small>
                </Card.Body>
              </Card>
            ) : (
              <div style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
                {filteredComplaints.map(fb => {
                  const isExpanded = expandedComplaint === fb.id
                  const getCategoryBadge = (cat) => {
                    const v = { bug: 'danger', feature: 'primary', improvement: 'info', complaint: 'warning', general: 'secondary' }
                    return <Badge bg={v[cat] || 'secondary'} style={{ fontSize: '0.68rem' }}>{cat}</Badge>
                  }
                  const getStatusBadge = (status) => {
                    const v = { pending: 'warning', reviewed: 'info', resolved: 'success' }
                    return <Badge bg={v[status] || 'secondary'} style={{ fontSize: '0.68rem' }}>{status}</Badge>
                  }

                  return (
                    <Card key={fb.id} className="shadow-sm mb-2" style={fb.status === 'pending' ? { borderLeft: '3px solid #f59e0b' } : {}}>
                      <Card.Header
                        className="py-2 px-3"
                        style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0f9fa' : '#f8f9fa' }}
                        onClick={() => setExpandedComplaint(isExpanded ? null : fb.id)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                            <strong>{fb.title}</strong>
                            {getCategoryBadge(fb.category)}
                            {getStatusBadge(fb.status)}
                          </div>
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.78rem' }}>
                            <span className="text-muted">{fb.username}</span>
                            <Badge bg="light" text="dark" style={{ fontSize: '0.65rem' }}>{fb.userRole}</Badge>
                            <small className="text-muted">
                              {new Date(fb.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </small>
                          </div>
                        </div>
                      </Card.Header>

                      {isExpanded && (
                        <Card.Body className="py-2 px-3">
                          <p style={{ fontSize: '0.83rem', whiteSpace: 'pre-wrap' }} className="mb-2">{fb.message}</p>

                          <div className="d-flex align-items-center gap-1 mb-2" style={{ fontSize: '0.78rem' }}>
                            <small className="text-muted">
                              Submitted: {new Date(fb.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </div>

                          {fb.adminNote && (
                            <div className="p-2 rounded mb-2" style={{ backgroundColor: '#f0f9fa', fontSize: '0.8rem' }}>
                              <strong className="text-theme">Admin Response:</strong> {fb.adminNote}
                            </div>
                          )}

                          {/* Reply form */}
                          {replyingTo === fb.id && (
                            <div className="mb-2">
                              <Form.Control
                                as="textarea"
                                rows={2}
                                size="sm"
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                style={{ fontSize: '0.82rem' }}
                              />
                              <div className="d-flex gap-1 mt-1">
                                <Button size="sm" variant="success" onClick={() => handleReply(fb.id)} style={{ fontSize: '0.75rem' }}>
                                  Send & Resolve
                                </Button>
                                <Button size="sm" variant="outline-secondary" onClick={() => { setReplyingTo(null); setReplyText('') }} style={{ fontSize: '0.75rem' }}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="d-flex gap-1">
                            {fb.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={() => handleStatusChange(fb.id, 'reviewed')}
                                style={{ fontSize: '0.75rem' }}
                              >
                                <FaEye className="me-1" size={10} /> Mark Reviewed
                              </Button>
                            )}
                            {fb.status !== 'resolved' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() => handleStatusChange(fb.id, 'resolved')}
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  <FaCheck className="me-1" size={10} /> Resolve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => { setReplyingTo(fb.id); setReplyText('') }}
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  <FaReply className="me-1" size={10} /> Reply & Resolve
                                </Button>
                              </>
                            )}
                            {createdIssues[fb.id] ? (
                              <a
                                href={createdIssues[fb.id].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-success"
                                style={{ fontSize: '0.75rem' }}
                              >
                                <FaGithub className="me-1" size={10} />
                                Issue #{createdIssues[fb.id].number}
                              </a>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline-dark"
                                disabled={creatingIssue === fb.id}
                                onClick={() => createComplaintIssue(fb)}
                                style={{ fontSize: '0.75rem' }}
                              >
                                <FaGithub className="me-1" size={10} />
                                {creatingIssue === fb.id ? 'Creating...' : 'Create Issue'}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteComplaint(fb.id)}
                              style={{ fontSize: '0.75rem' }}
                            >
                              <FaTrash className="me-1" size={10} /> Delete
                            </Button>
                          </div>
                        </Card.Body>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </Tab.Pane>

          {/* ===== ERROR LOGS TAB ===== */}
          <Tab.Pane eventKey="error-logs">
            {/* Filters */}
            <Row className="mb-3">
              <Col>
                <Card className="shadow-sm">
                  <Card.Body className="py-2 px-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <DateRangePicker
                        value={logsTimeRange}
                        onChange={(range, dates) => {
                          setLogsTimeRange(range)
                          if (range === 'custom') setLogsCustomDates(dates)
                        }}
                        presets={[
                          { key: 'all', label: 'All' },
                          { key: 1, label: '24h' },
                          { key: 7, label: '7 Days' },
                          { key: 30, label: '30 Days' },
                        ]}
                      />

                      <div className="d-flex align-items-center gap-2">
                        <Form.Select
                          size="sm"
                          value={logsPerPage}
                          onChange={(e) => setLogsPerPage(Number(e.target.value))}
                          style={{ width: 'auto' }}
                        >
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                          <option value={50}>50 / page</option>
                          <option value={100}>100 / page</option>
                        </Form.Select>

                        <Button size="sm" variant="outline-secondary" onClick={loadLogs} title="Refresh">
                          <FaSync />
                        </Button>

                        {logs.length > 0 && (
                          <Button size="sm" variant="outline-danger" onClick={handleClearAll} title="Clear all logs">
                            <FaTrash className="me-1" /> Clear All
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Stats */}
            <Row className="mb-3">
              <Col xs={6} md={3}>
                <Card className="text-center shadow-sm">
                  <Card.Body className="py-2">
                    <h4 className="mb-0 text-theme">{logs.length}</h4>
                    <small className="text-muted">Total Errors</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className="text-center shadow-sm">
                  <Card.Body className="py-2">
                    <h4 className="mb-0 text-danger">
                      {logs.filter(l => l.source === 'ErrorBoundary').length}
                    </h4>
                    <small className="text-muted">Render Crashes</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className="text-center shadow-sm">
                  <Card.Body className="py-2">
                    <h4 className="mb-0 text-warning">
                      {logs.filter(l => l.source === 'window.onerror').length}
                    </h4>
                    <small className="text-muted">Runtime Errors</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className="text-center shadow-sm">
                  <Card.Body className="py-2">
                    <h4 className="mb-0" style={{ color: '#333' }}>
                      {logs.filter(l => l.source === 'unhandledrejection').length}
                    </h4>
                    <small className="text-muted">Unhandled Promises</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Error Logs Table */}
            {logsLoading ? (
              <LoadingSpinner text="Loading error logs..." />
            ) : (
              <Card className="shadow-sm">
                <Card.Header className="py-2 px-3">
                  <small className="fw-bold text-muted">ERROR LOGS ({sortedLogs.length})</small>
                </Card.Header>
                <Card.Body className="p-0">
                  {paginatedLogs.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <FaBug size={24} className="mb-2 d-block mx-auto" style={{ opacity: 0.3 }} />
                      <small>No error logs found</small>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto', overflowX: 'auto' }}>
                      <Table size="sm" hover className="mb-0" style={{ fontSize: '0.82rem' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th
                              style={{ cursor: 'pointer', width: '160px', padding: '8px 10px' }}
                              onClick={() => handleSort('timestamp')}
                            >
                              Time <SortIcon field="timestamp" />
                            </th>
                            <th
                              style={{ cursor: 'pointer', width: '120px', padding: '8px 10px' }}
                              onClick={() => handleSort('source')}
                            >
                              Source <SortIcon field="source" />
                            </th>
                            <th
                              style={{ cursor: 'pointer', padding: '8px 10px' }}
                              onClick={() => handleSort('message')}
                            >
                              Message <SortIcon field="message" />
                            </th>
                            <th
                              style={{ cursor: 'pointer', width: '100px', padding: '8px 10px' }}
                              onClick={() => handleSort('username')}
                            >
                              User <SortIcon field="username" />
                            </th>
                            <th style={{ width: '50px', padding: '8px 10px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedLogs.map(log => (
                            <React.Fragment key={log.id}>
                              <tr
                                style={{ cursor: 'pointer' }}
                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              >
                                <td className="text-muted" style={{ padding: '6px 10px' }}>
                                  {formatTimestamp(log.timestamp)}
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  {getSourceBadge(log.source)}
                                </td>
                                <td style={{ padding: '6px 10px', maxWidth: '400px' }}>
                                  <span className="text-truncate d-inline-block" style={{ maxWidth: '100%' }}>
                                    {log.message}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  {log.username || <span className="text-muted">-</span>}
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="text-danger p-0"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(log.id) }}
                                    title="Delete"
                                  >
                                    <FaTrash size={12} />
                                  </Button>
                                </td>
                              </tr>
                              {expandedLog === log.id && (
                                <tr>
                                  <td colSpan={5} style={{ backgroundColor: '#f8f9fa', padding: '10px 14px' }}>
                                    <div style={{ fontSize: '0.78rem' }}>
                                      <div className="mb-1"><strong>URL:</strong> {log.url || 'N/A'}</div>
                                      <div className="mb-1"><strong>User:</strong> {log.username || 'N/A'} ({log.userRole || 'N/A'})</div>
                                      {log.stack && (
                                        <div className="mb-1">
                                          <strong>Stack Trace:</strong>
                                          <pre style={{
                                            fontSize: '0.72rem',
                                            backgroundColor: '#fff',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '4px',
                                            padding: '8px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            margin: '4px 0 0',
                                          }}>
                                            {log.stack}
                                          </pre>
                                        </div>
                                      )}
                                      {log.componentStack && (
                                        <div>
                                          <strong>Component Stack:</strong>
                                          <pre style={{
                                            fontSize: '0.72rem',
                                            backgroundColor: '#fff',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '4px',
                                            padding: '8px',
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            margin: '4px 0 0',
                                          }}>
                                            {log.componentStack}
                                          </pre>
                                        </div>
                                      )}
                                      <div className="mt-2">
                                        {createdIssues[log.id] ? (
                                          <a
                                            href={createdIssues[log.id].url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-success"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <FaGithub className="me-1" size={12} />
                                            Issue #{createdIssues[log.id].number}
                                          </a>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline-dark"
                                            disabled={creatingIssue === log.id}
                                            onClick={(e) => { e.stopPropagation(); createErrorIssue(log) }}
                                            style={{ fontSize: '0.75rem' }}
                                          >
                                            <FaGithub className="me-1" size={12} />
                                            {creatingIssue === log.id ? 'Creating...' : 'Create Issue'}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>

                {totalPages > 1 && (
                  <Card.Footer className="py-2 px-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {((currentPage - 1) * logsPerPage) + 1}-{Math.min(currentPage * logsPerPage, sortedLogs.length)} of {sortedLogs.length}
                      </small>
                      <Pagination size="sm" className="mb-0">
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page =>
                            page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)
                          )
                          .map((page, index, array) => {
                            const prevPage = array[index - 1]
                            const showEllipsis = prevPage && page - prevPage > 1
                            return (
                              <span key={page}>
                                {showEllipsis && <Pagination.Ellipsis disabled />}
                                <Pagination.Item
                                  active={page === currentPage}
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </Pagination.Item>
                              </span>
                            )
                          })}
                        <Pagination.Next onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  </Card.Footer>
                )}
              </Card>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  )
}

export default SystemMaintenance
