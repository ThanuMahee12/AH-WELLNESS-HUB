import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Dropdown, Badge, ListGroup } from 'react-bootstrap'
import { FaBell, FaCheck, FaCheckDouble } from 'react-icons/fa'
import { subscribeToNotifications, markAsRead, markAllAsRead } from '../services/notificationService'
import { formatDistanceToNow } from 'date-fns'

function NotificationBell() {
  const { user } = useSelector(state => state.auth)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.uid) return

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications)
      const unread = newNotifications.filter(n => !n.read).length
      setUnreadCount(unread)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [user?.uid])

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation()
    await markAsRead(notificationId)
  }

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation()
    if (user?.uid) {
      await markAllAsRead(user.uid)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'role_request_submitted':
        return '📨'
      case 'role_request_approved':
        return '✅'
      case 'role_request_rejected':
        return '❌'
      default:
        return '📌'
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now'

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    try {
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Recently'
    }
  }

  return (
    <Dropdown align="end" className="d-inline-block">
      <Dropdown.Toggle
        variant="link"
        id="notification-dropdown"
        className="text-decoration-none position-relative p-2"
        style={{ color: '#0891B2' }}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge
            pill
            bg="danger"
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        style={{
          width: '350px',
          maxHeight: '500px',
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <strong style={{ fontSize: '0.95rem' }}>Notifications</strong>
          {unreadCount > 0 && (
            <button
              className="btn btn-link btn-sm text-decoration-none p-0"
              onClick={handleMarkAllAsRead}
              style={{ fontSize: '0.8rem', color: '#0891B2' }}
            >
              <FaCheckDouble className="me-1" />
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center text-muted py-4">
            <FaBell size={30} className="mb-2 opacity-25" />
            <p className="mb-0" style={{ fontSize: '0.85rem' }}>No notifications</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {notifications.map((notification) => (
              <ListGroup.Item
                key={notification.id}
                className={`border-0 ${!notification.read ? 'bg-light' : ''}`}
                style={{
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  borderBottom: '1px solid #dee2e6'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#f8f9fa'}
              >
                <div className="d-flex align-items-start">
                  <div style={{ fontSize: '1.5rem', marginRight: '10px', minWidth: '30px' }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <strong style={{ fontSize: '0.9rem', color: '#0891B2' }}>
                        {notification.title}
                      </strong>
                      {!notification.read && (
                        <button
                          className="btn btn-link btn-sm p-0 ms-2"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          style={{ fontSize: '0.75rem', color: '#0891B2' }}
                          title="Mark as read"
                        >
                          <FaCheck />
                        </button>
                      )}
                    </div>
                    <p className="mb-1" style={{ fontSize: '0.85rem', color: '#333' }}>
                      {notification.message}
                    </p>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {formatTimestamp(notification.createdAt)}
                    </small>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default NotificationBell
