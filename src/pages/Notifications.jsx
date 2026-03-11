import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Badge, Pagination } from 'react-bootstrap'
import { FaBell, FaCheck, FaCheckDouble } from 'react-icons/fa'
import { subscribeToNotifications, markAsRead, markAllAsRead } from '../services/notificationService'
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
    <div className="d-flex flex-column" style={{ padding: '10px 16px', height: 'calc(100vh - 60px)' }}>
      {/* Header - fixed */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-shrink-0">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <FaBell className="text-theme" /> Notifications
        </h5>
      </div>

      {/* Filters - fixed */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-shrink-0">
        <div className="d-flex gap-1">
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-theme' : 'btn-outline-secondary'}`}
              onClick={() => { setFilter(f); setPage(1) }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <Badge pill bg="danger" className="ms-1" style={{ fontSize: '0.65rem' }}>{unreadCount}</Badge>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-link text-theme p-0" onClick={handleMarkAllAsRead}>
            <FaCheckDouble className="me-1" />
            <span className="d-none d-sm-inline">Mark all read</span>
            <span className="d-sm-none">All read</span>
          </button>
        )}
      </div>

      {/* List - scrollable middle */}
      {filtered.length === 0 ? (
        <div className="text-center text-muted py-5 flex-grow-1">
          <FaBell size={32} className="mb-2 opacity-25" />
          <p className="mb-0" style={{ fontSize: '0.85rem' }}>
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </p>
        </div>
      ) : (
        <>
          <div className="flex-grow-1" style={{ overflowY: 'auto', minHeight: 0 }}>
            {paginated.map((n) => (
              <div
                key={n.id}
                className="d-flex align-items-start"
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                  borderLeft: !n.read ? '3px solid var(--theme-primary, #0891B2)' : '3px solid transparent',
                  paddingLeft: '8px',
                  background: !n.read ? 'rgba(8,145,178,0.03)' : 'transparent',
                }}
              >
                <span style={{ fontSize: '0.85rem', marginRight: '6px', lineHeight: 1 }}>{icon(n.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-start gap-1">
                    <strong style={{ fontSize: '0.82rem', color: 'var(--theme-primary, #0891B2)' }} className="text-truncate">
                      {n.title}
                    </strong>
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      <small className="text-muted" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {timeAgo(n.createdAt)}
                      </small>
                      {!n.read && (
                        <button
                          className="btn btn-link p-0 text-theme"
                          onClick={() => handleMarkAsRead(n)}
                          title="Mark as read"
                          style={{ lineHeight: 1 }}
                        >
                          <FaCheck style={{ fontSize: '0.7rem' }} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mb-0" style={{ fontSize: '0.8rem', color: '#555', wordBreak: 'break-word' }}>
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - fixed bottom */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 flex-shrink-0" style={{ borderTop: '1px solid #eee' }}>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">
                {Math.min((page - 1) * perPage + 1, filtered.length)}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </small>
              <select
                className="form-select form-select-sm border-0 text-theme fw-semibold"
                style={{
                  width: 'auto',
                  fontSize: '0.78rem',
                  padding: '3px 28px 3px 10px',
                  borderRadius: '20px',
                  background: '#f1f3f5 url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3e%3cpath fill=\'none\' stroke=\'%230891B2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m2 5 6 6 6-6\'/%3e%3c/svg%3e") no-repeat right 8px center/10px 10px',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  outline: 'none',
                  border: 'none',
                }}
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              >
                {[10, 50, 100, 500].map(v => (
                  <option key={v} value={v}>{v} / page</option>
                ))}
              </select>
            </div>
            {totalPages > 1 && (
              <Pagination className="mb-0" size="sm">
                <Pagination.First
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                />
                <Pagination.Prev
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                />
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === page}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    )
                  } else if (
                    pageNum === page - 2 ||
                    pageNum === page + 2
                  ) {
                    return <Pagination.Ellipsis key={pageNum} disabled />
                  }
                  return null
                })}
                <Pagination.Next
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                />
                <Pagination.Last
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                />
              </Pagination>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Notifications
