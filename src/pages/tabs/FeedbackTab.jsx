import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Card, Form, Button, Badge, Row, Col } from 'react-bootstrap'
import { FaPaperPlane } from 'react-icons/fa'
import { submitFeedback, getUserFeedbacks } from '../../services/feedbackService'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'general', label: 'General' },
]

function FeedbackTab() {
  const { user } = useSelector(state => state.auth)
  const { success: showSuccess, error: showError } = useNotification()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedbacks, setFeedbacks] = useState([])
  const [form, setForm] = useState({ title: '', category: 'general', message: '' })

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    setLoading(true)
    try {
      const result = await getUserFeedbacks(user.uid)
      if (result.success) {
        setFeedbacks(result.data)
      }
    } catch (err) {
      showError('Failed to load feedbacks')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      showError('Please fill in title and message')
      return
    }

    setSubmitting(true)
    try {
      const result = await submitFeedback({
        title: form.title.trim(),
        message: form.message.trim(),
        category: form.category,
        userId: user.uid,
        username: user.username || user.email,
        userRole: user.role,
      })

      if (result.success) {
        showSuccess('Feedback submitted successfully')
        setForm({ title: '', category: 'general', message: '' })
        loadFeedbacks()
      } else {
        showError('Failed to submit feedback')
      }
    } catch (err) {
      showError('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = { pending: 'warning', reviewed: 'info', resolved: 'success' }
    return <Badge bg={variants[status] || 'secondary'} style={{ fontSize: '0.7rem' }}>{status}</Badge>
  }

  const getCategoryBadge = (category) => {
    const variants = { bug: 'danger', feature: 'primary', improvement: 'info', complaint: 'warning', general: 'secondary' }
    return <Badge bg={variants[category] || 'secondary'} style={{ fontSize: '0.7rem' }}>{category}</Badge>
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <>
      {/* Submit Feedback Form */}
      <Card className="shadow-sm mb-3">
        <Card.Header style={{ backgroundColor: '#f8f9fa' }}>
          <h6 className="mb-0"><FaPaperPlane className="me-2 text-theme" />Submit Feedback</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-2">
              <Col md={8}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.85rem' }}>Title</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Brief summary of your feedback"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.85rem' }}>Category</Form.Label>
                  <Form.Select
                    size="sm"
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: '0.85rem' }}>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                size="sm"
                placeholder="Describe your feedback in detail..."
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                maxLength={1000}
              />
              <Form.Text className="text-muted">{form.message.length}/1000</Form.Text>
            </Form.Group>
            <div className="text-end">
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !form.title.trim() || !form.message.trim()}
                style={{ backgroundColor: '#0891B2', borderColor: '#0891B2' }}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* My Feedbacks List */}
      <Card className="shadow-sm">
        <Card.Header className="py-2 px-3" style={{ backgroundColor: '#f8f9fa' }}>
          <small className="fw-bold text-muted">MY FEEDBACKS ({feedbacks.length})</small>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <LoadingSpinner text="Loading feedbacks..." />
          ) : feedbacks.length === 0 ? (
            <div className="text-center text-muted py-4">
              <small>No feedbacks submitted yet</small>
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 520px)', overflowY: 'auto' }}>
              {feedbacks.map(fb => (
                <div
                  key={fb.id}
                  className="border-bottom px-3 py-2"
                  style={{ fontSize: '0.83rem' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div>
                      <strong>{fb.title}</strong>
                      <span className="ms-2">{getCategoryBadge(fb.category)}</span>
                      <span className="ms-2">{getStatusBadge(fb.status)}</span>
                    </div>
                    <small className="text-muted">{formatTimestamp(fb.timestamp)}</small>
                  </div>
                  <p className="mb-1 text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                    {fb.message}
                  </p>
                  {fb.adminNote && (
                    <div className="mt-1 p-2 rounded" style={{ backgroundColor: '#f0f9fa', fontSize: '0.78rem' }}>
                      <strong className="text-theme">Admin Response:</strong> {fb.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default FeedbackTab
