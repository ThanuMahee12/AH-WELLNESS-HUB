import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Dropdown, Badge } from 'react-bootstrap'
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
    <Dropdown align="end" className="d-inline-block" autoClose="outside" style={{ position: 'static' }}>
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
        className="shadow-lg"
        renderOnMount
        popperConfig={{
          strategy: 'fixed',
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 8]
              }
            },
            {
              name: 'preventOverflow',
              options: {
                padding: 8
              }
            }
          ]
        }}
        style={{
          width: window.innerWidth < 576 ? 'calc(100vw - 16px)' : '350px',
          maxWidth: '350px',
          maxHeight: window.innerWidth < 576 ? 'calc(100vh - 80px)' : '500px',
          padding: 0,
          border: '1px solid #dee2e6',
          borderRadius: '0.5rem',
          zIndex: 9999
        }}
      >
        {/* Sticky Header */}
        <div
          className="px-3 py-2 border-bottom bg-white"
          style={{
            borderTopLeftRadius: '0.5rem',
            borderTopRightRadius: '0.5rem'
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
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
        </div>

        {/* Scrollable Content */}
        <div style={{
          maxHeight: window.innerWidth < 576 ? 'calc(100vh - 140px)' : '440px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {notifications.length === 0 ? (
            <div className="text-center text-muted py-4">
              <FaBell size={30} className="mb-2 opacity-25" />
              <p className="mb-0" style={{ fontSize: '0.85rem' }}>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${!notification.read ? 'bg-light' : ''}`}
                style={{
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  borderBottom: '1px solid #f0f0f0',
                  padding: window.innerWidth < 576 ? '8px 12px' : '12px 16px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#f8f9fa'}
              >
                <div className="d-flex align-items-start">
                  <div style={{
                    fontSize: window.innerWidth < 576 ? '1.2rem' : '1.5rem',
                    marginRight: window.innerWidth < 576 ? '8px' : '10px',
                    minWidth: window.innerWidth < 576 ? '24px' : '30px'
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1, fontSize: window.innerWidth < 576 ? '0.8rem' : '0.85rem' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <strong style={{
                        fontSize: window.innerWidth < 576 ? '0.85rem' : '0.9rem',
                        color: '#0891B2'
                      }}>
                        {notification.title}
                      </strong>
                      {!notification.read && (
                        <button
                          className="btn btn-link btn-sm p-0 ms-2"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          style={{
                            fontSize: '0.75rem',
                            color: '#0891B2',
                            minWidth: '44px',
                            minHeight: '44px'
                          }}
                          title="Mark as read"
                        >
                          <FaCheck />
                        </button>
                      )}
                    </div>
                    <p className="mb-1" style={{
                      fontSize: window.innerWidth < 576 ? '0.8rem' : '0.85rem',
                      color: '#333'
                    }}>
                      {notification.message}
                    </p>
                    <small className="text-muted" style={{
                      fontSize: window.innerWidth < 576 ? '0.7rem' : '0.75rem'
                    }}>
                      {formatTimestamp(notification.createdAt)}
                    </small>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default NotificationBell
