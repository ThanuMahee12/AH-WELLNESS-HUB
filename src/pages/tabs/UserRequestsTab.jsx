import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Row, Col, Card, Badge, Button, Alert, Modal, Form } from 'react-bootstrap'
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa'
import {
  fetchUserChangeRequests,
  approveUserChangeRequest,
  rejectUserChangeRequest,
  selectAllUserChangeRequests
} from '../../store/userChangeRequestsSlice'
import { registerUser } from '../../store/authSlice'
import { fetchUsers } from '../../store/usersSlice'
import { useNotification } from '../../context'
import { generateRandomPassword, copyToClipboard } from '../../utils/passwordUtils'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function UserRequestsTab() {
  const dispatch = useDispatch()
  const { user: currentUser } = useSelector(state => state.auth)
  const changeRequests = useSelector(selectAllUserChangeRequests)
  const { loading } = useSelector(state => state.userChangeRequests)
  const { success, error: showError } = useNotification()

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingRequest, setRejectingRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const isSuperAdmin = currentUser?.role === 'superadmin'
  const isMaintainer = currentUser?.role === 'maintainer'

  useEffect(() => {
    dispatch(fetchUserChangeRequests())
  }, [dispatch])

  // Filter requests based on role
  const visibleRequests = isSuperAdmin
    ? changeRequests // SuperAdmin sees all requests
    : isMaintainer
    ? changeRequests.filter(r => r.requestedBy === currentUser.uid) // Maintainer sees only their own requests
    : []

  const pendingRequests = visibleRequests.filter(r => r.status === 'pending')
  const approvedRequests = visibleRequests.filter(r => r.status === 'approved')
  const rejectedRequests = visibleRequests.filter(r => r.status === 'rejected')

  const handleApproveRequest = async (request) => {
    try {
      // Execute the requested change
      if (request.type === 'create') {
        const randomPassword = generateRandomPassword()
        const result = await dispatch(registerUser({ ...request.data, password: randomPassword }))

        if (result.type.includes('fulfilled')) {
          await dispatch(approveUserChangeRequest({
            requestId: request.id,
            approvedBy: currentUser.uid
          }))
          dispatch(fetchUsers())
          setGeneratedPassword(randomPassword)
          setShowPasswordModal(true)
          success('User created and request approved!')
        } else {
          showError('Failed to create user')
        }
      } else if (request.type === 'update') {
        const result = await dispatch(updateUser({ id: request.userId, ...request.data }))

        if (result.type.includes('fulfilled')) {
          await dispatch(approveUserChangeRequest({
            requestId: request.id,
            approvedBy: currentUser.uid
          }))
          success('User updated and request approved!')
        } else {
          showError('Failed to update user')
        }
      }
    } catch (error) {
      showError('Failed to approve request')
    }
  }

  const handleRejectClick = (request) => {
    setRejectingRequest(request)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingRequest) return

    try {
      await dispatch(rejectUserChangeRequest({
        requestId: rejectingRequest.id,
        rejectedBy: currentUser.uid,
        reason: rejectionReason || 'Not approved'
      }))
      success('Request rejected')
      setShowRejectModal(false)
      setRejectingRequest(null)
      setRejectionReason('')
    } catch (error) {
      showError('Failed to reject request')
    }
  }

  const handleCopyPassword = async () => {
    const copied = await copyToClipboard(generatedPassword)
    if (copied) {
      success('Password copied to clipboard!')
    } else {
      showError('Failed to copy password')
    }
  }

  const renderRequestCard = (request) => {
    const getBadgeColor = (status) => {
      switch (status) {
        case 'pending': return '#FFA500'
        case 'approved': return '#06B6D4'
        case 'rejected': return '#DC3545'
        default: return '#6c757d'
      }
    }

    const getStatusIcon = (status) => {
      switch (status) {
        case 'pending': return <FaClock />
        case 'approved': return <FaCheckCircle />
        case 'rejected': return <FaTimesCircle />
        default: return null
      }
    }

    return (
      <Card key={request.id} className="mb-3 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h6>
                <Badge style={{ backgroundColor: request.type === 'create' ? '#06B6D4' : '#0891B2', color: 'white' }}>
                  {request.type === 'create' ? 'NEW USER REQUEST' : 'UPDATE USER REQUEST'}
                </Badge>
              </h6>
              <small className="text-muted">
                Requested by: <strong>{request.requestedByName}</strong>
              </small>
            </div>
            <Badge style={{ backgroundColor: getBadgeColor(request.status), color: 'white' }}>
              {getStatusIcon(request.status)} {request.status.toUpperCase()}
            </Badge>
          </div>

          <Card className="mb-2" style={{ backgroundColor: '#f8f9fa' }}>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <strong>Username:</strong> {request.data.username}<br/>
                  <strong>Email:</strong> {request.data.email}<br/>
                  <strong>Mobile:</strong> {request.data.mobile}<br/>
                  <strong>Role:</strong> <Badge style={{ backgroundColor: '#06B6D4', color: 'white' }}>{request.data.role}</Badge>
                </Col>
                {request.originalData && (
                  <Col md={6}>
                    <small className="text-muted">Previous values:</small><br/>
                    <small>Username: {request.originalData.username}</small><br/>
                    <small>Email: {request.originalData.email}</small><br/>
                    <small>Mobile: {request.originalData.mobile}</small><br/>
                    <small>Role: <Badge style={{ backgroundColor: '#94a3b8', color: 'white' }}>{request.originalData.role}</Badge></small>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {request.status === 'rejected' && request.rejectionReason && (
            <Alert variant="danger" className="mb-2">
              <strong>Rejection Reason:</strong> {request.rejectionReason}
            </Alert>
          )}

          {request.status === 'pending' && isSuperAdmin && (
            <div className="d-flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => handleApproveRequest(request)}
                style={{ backgroundColor: '#06B6D4', border: 'none', color: 'white' }}
              >
                <FaCheckCircle /> Approve
              </Button>
              <Button
                size="sm"
                onClick={() => handleRejectClick(request)}
                variant="danger"
              >
                <FaTimesCircle /> Reject
              </Button>
            </div>
          )}

          {request.status === 'approved' && request.approvedAt && (
            <small className="text-muted">
              Approved on: {new Date(request.approvedAt?.seconds * 1000).toLocaleString()}
            </small>
          )}

          {request.status === 'rejected' && request.rejectedAt && (
            <small className="text-muted">
              Rejected on: {new Date(request.rejectedAt?.seconds * 1000).toLocaleString()}
            </small>
          )}
        </Card.Body>
      </Card>
    )
  }

  if (loading && visibleRequests.length === 0) {
    return <LoadingSpinner text="Loading user requests..." />
  }

  return (
    <>
      {!isSuperAdmin && !isMaintainer && (
        <Alert variant="warning">
          You don't have permission to view user requests.
        </Alert>
      )}

      {(isSuperAdmin || isMaintainer) && (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ borderTop: '3px solid #FFA500' }}>
                <Card.Body>
                  <h3 className="mb-0" style={{ color: '#FFA500' }}>{pendingRequests.length}</h3>
                  <small className="text-muted">Pending Requests</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ borderTop: '3px solid #06B6D4' }}>
                <Card.Body>
                  <h3 className="mb-0" style={{ color: '#06B6D4' }}>{approvedRequests.length}</h3>
                  <small className="text-muted">Approved Requests</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ borderTop: '3px solid #DC3545' }}>
                <Card.Body>
                  <h3 className="mb-0" style={{ color: '#DC3545' }}>{rejectedRequests.length}</h3>
                  <small className="text-muted">Rejected Requests</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <h5 className="mb-3">Pending Requests</h5>
              {pendingRequests.length === 0 ? (
                <Alert variant="info">No pending requests</Alert>
              ) : (
                pendingRequests.map(request => renderRequestCard(request))
              )}

              <h5 className="mb-3 mt-4">Request History</h5>
              {approvedRequests.length === 0 && rejectedRequests.length === 0 ? (
                <Alert variant="info">No request history</Alert>
              ) : (
                <>
                  {approvedRequests.map(request => renderRequestCard(request))}
                  {rejectedRequests.map(request => renderRequestCard(request))}
                </>
              )}
            </Col>
          </Row>
        </>
      )}

      {/* Password Display Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>User Created Successfully</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">
            <strong>Generated Password:</strong>
            <div className="mt-2 p-3 bg-white rounded border">
              <code className="fs-5">{generatedPassword}</code>
            </div>
          </Alert>
          <Alert variant="warning">
            <strong>Important:</strong> Copy this password now. It will not be shown again.
            Share it securely with the user.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCopyPassword}>
            Copy Password
          </Button>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Request Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reject Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to reject this request?</p>
          <Alert variant="info" className="mb-3">
            <strong>Request by:</strong> {rejectingRequest?.requestedByName}<br/>
            <strong>Type:</strong> {rejectingRequest?.type === 'create' ? 'New User' : 'Update User'}
          </Alert>
          <Form.Group>
            <Form.Label>Rejection Reason (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRejectConfirm}>
            <FaTimesCircle /> Reject Request
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default UserRequestsTab
