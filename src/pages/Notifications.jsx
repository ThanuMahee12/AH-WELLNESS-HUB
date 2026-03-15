import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Badge, Pagination, Card, Form } from 'react-bootstrap'
import { FaBell, FaCheck, FaCheckDouble } from 'react-icons/fa'
import { subscribeToNotifications, markAsRead, markAllAsRead } from '../services/notificationService'
import { PageHeader } from '../components/ui'
import { formatDistanceToNow } from 'date-fns'

function Notifications() {
  const { user } = useSelector(state => state.auth)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [perPage, setPerPage] = useState(50)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = subscribeToNotifications(user.uid, (n) => {
      setNotifications(n)
      setUnreadCount(n.filter(x => !x.read).length)
    })
    return () => unsubscribe()
  }, [user?.uid])

  const handleMarkAsRead = (n) => markAsRead(n.id, n.isSystem ? user.uid : null)
  const handleMarkAllAsRead = () => user?.uid && markAllAsRead(user.uid)

  const icon = (type) => {
    if (type === 'role_request_submitted') return '📨'
    if (type === 'role_request_approved') return '✅'
    if (type === 'role_request_rejected') return '❌'
    if (type === 'system_release') return '🚀'
    return '📌'
  }

  const timeAgo = (ts) => {
    if (!ts) return 'Just now'
    try { return formatDistanceToNow(ts.toDate ? ts.toDate() : new Date(ts), { addSuffix: true }) }
    catch { return 'Recently' }
  }

  const filtered = notifications.filter(n =>
    filter === 'unread' ? !n.read : filter === 'read' ? n.read : true
  )
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="d-flex flex-column p-3 p-md-4" style={{ height: 'calc(100vh - 52px)' }}>
      {/* Header */}
      <div className="flex-shrink-0">
        <PageHeader icon={FaBell} title="Notifications" />
      </div>

      <Card className="shadow-sm border-0 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        {/* Fixed Filter Bar */}
        <div className="py-2 px-3 border-bottom flex-shrink-0">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-1">
              {['all', 'unread', 'read'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilter(f); setPage(1) }}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    ...(filter === f ? { backgroundColor: '#0891B2', borderColor: '#0891B2' } : {}),
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'unread' && unreadCount > 0 && (
                    <Badge pill bg="danger" className="ms-1" style={{ fontSize: '0.6rem' }}>{unreadCount}</Badge>
                  )}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-link p-0"
                onClick={handleMarkAllAsRead}
                style={{ fontSize: '0.75rem', color: '#0891B2', textDecoration: 'none' }}
              >
                <FaCheckDouble className="me-1" size={11} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Scrollable List */}
        {filtered.length === 0 ? (
          <div className="text-center text-muted py-5 flex-grow-1 d-flex flex-column align-items-center justify-content-center">
            <FaBell size={28} className="mb-2" style={{ opacity: 0.2 }} />
            <small>{filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}</small>
          </div>
        ) : (
          <div className="flex-grow-1" style={{ overflow: 'auto', minHeight: 0 }}>
            {paginated.map(n => (
              <div
                key={n.id}
                className="d-flex align-items-start px-3"
                onClick={() => !n.read && handleMarkAsRead(n)}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9',
                  borderLeft: !n.read ? '3px solid #0891B2' : '3px solid transparent',
                  background: !n.read ? '#f0fdfa' : 'transparent',
                  cursor: !n.read ? 'pointer' : 'default',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!n.read) e.currentTarget.style.background = '#e0f7fa' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = !n.read ? '#f0fdfa' : 'transparent' }}
              >
                <span style={{ fontSize: '0.82rem', marginRight: 8, marginTop: 2, lineHeight: 1 }}>{icon(n.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-start gap-1">
                    <strong style={{ fontSize: '0.8rem', color: '#334155' }} className="text-truncate">
                      {n.title}
                    </strong>
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      <small className="text-muted" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        {timeAgo(n.createdAt)}
                      </small>
                      {!n.read && (
                        <button
                          className="btn btn-link p-0"
                          onClick={() => handleMarkAsRead(n)}
                          title="Mark as read"
                          style={{ lineHeight: 1, color: '#0891B2' }}
                        >
                          <FaCheck size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mb-0" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fixed Footer */}
        <div className="py-2 px-3 border-top bg-white flex-shrink-0">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                {filtered.length > 0
                  ? `${Math.min((page - 1) * perPage + 1, filtered.length)}-${Math.min(page * perPage, filtered.length)} of ${filtered.length}`
                  : '0 items'}
              </small>
              <Form.Select
                size="sm"
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
                style={{ width: 'auto', fontSize: '0.72rem', border: '1px solid #e2e8f0', borderRadius: 6 }}
              >
                {[10, 50, 100].map(v => (
                  <option key={v} value={v}>{v} / page</option>
                ))}
              </Form.Select>
            </div>
            {totalPages > 1 ? (
              <Pagination className="mb-0" size="sm">
                <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>{p}</Pagination.Item>
                  }
                  if (p === page - 2 || p === page + 2) return <Pagination.Ellipsis key={p} disabled />
                  return null
                })}
                <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
              </Pagination>
            ) : (
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>{filtered.length} items</small>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Notifications
