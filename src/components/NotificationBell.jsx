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
    <Dropdown align="end" className="d-inline-block" autoClose="outside">
      <Dropdown.Toggle
        variant="link"
        id="notification-dropdown"
        className="text-decoration-none position-relative p-2 text-theme"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge
            pill
            bg="danger"
            className="position-absolute top-0 start-100 translate-middle fs-responsive-sm"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="shadow-lg notification-dropdown-menu z-dropdown"
        renderOnMount
        popperConfig={{
          strategy: 'fixed',
          modifiers: [
            { name: 'offset', options: { offset: [0, 8] } },
            { name: 'preventOverflow', options: { padding: 8 } }
          ]
        }}
      >
        {/* Sticky Header */}
        <div className="px-3 py-2 border-bottom bg-white notification-header">
          <div className="d-flex justify-content-between align-items-center">
            <strong className="fs-responsive-base">Notifications</strong>
            {unreadCount > 0 && (
              <button
                className="btn btn-link btn-sm text-decoration-none p-0 text-theme fs-responsive-sm"
                onClick={handleMarkAllAsRead}
              >
                <FaCheckDouble className="me-1" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="notification-content">
          {notifications.length === 0 ? (
            <div className="text-center text-muted py-4">
              <FaBell size={30} className="mb-2 opacity-25" />
              <p className="mb-0 fs-responsive-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div className="d-flex align-items-start">
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <strong className="text-theme notification-title">
                        {notification.title}
                      </strong>
                      {!notification.read && (
                        <button
                          className="btn btn-link btn-sm p-0 ms-2 text-theme touch-target notification-time"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Mark as read"
                        >
                          <FaCheck />
                        </button>
                      )}
                    </div>
                    <p className="mb-1 notification-message">
                      {notification.message}
                    </p>
                    <small className="text-muted notification-time">
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
