import { useState, useEffect, useRef } from 'react'
import { Container, Navbar as BSNavbar, Badge } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaBell, FaChevronDown } from 'react-icons/fa'
import { logoutUser } from '../store/authSlice'
import { subscribeToNotifications } from '../services/notificationService'
import bloodLabLogo from '../assets/blood-lab-logo.png'
import '../styles/navbar.css'

function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector(state => state.auth)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = subscribeToNotifications(user.uid, (notifications) => {
      setUnreadCount(notifications.filter(n => !n.read).length)
    })
    return () => unsubscribe()
  }, [user?.uid])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    dispatch(logoutUser())
    navigate('/login')
  }

  const handleUserClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setDropdownOpen(prev => !prev)
  }

  return (
    <BSNavbar className="top-navbar shadow-sm" expand="lg">
      <Container fluid className="px-3 px-md-4">
        <BSNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src={bloodLabLogo}
            alt="Blood Lab Manager"
            className="brand-logo"
            style={{ height: '50px', width: 'auto' }}
          />
          <span className="brand-text ms-2">AH-WH</span>
        </BSNavbar.Brand>

        <div className="d-flex align-items-center ms-auto gap-2">
          {/* Notification bell */}
          {isAuthenticated && (
            <button
              className="btn btn-link text-decoration-none position-relative text-theme touch-target d-flex align-items-center justify-content-center"
              onClick={() => navigate('/notifications')}
              title="Notifications"
              style={{ padding: 'clamp(4px, 1vw, 8px)' }}
            >
              <FaBell style={{ fontSize: 'clamp(14px, 3vw, 18px)' }} />
              {unreadCount > 0 && (
                <Badge
                  pill
                  bg="danger"
                  className="position-absolute"
                  style={{
                    top: '2px',
                    right: '0px',
                    fontSize: 'clamp(0.5rem, 1.5vw, 0.6rem)',
                    padding: '1px 4px',
                    minWidth: '14px',
                    lineHeight: '1.2',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </button>
          )}

          {/* User dropdown */}
          <div className="position-relative" ref={dropdownRef}>
            <button
              className="btn btn-link text-decoration-none d-flex align-items-center gap-1 text-white touch-target"
              onClick={handleUserClick}
              style={{ padding: 'clamp(4px, 1vw, 6px) clamp(6px, 1.5vw, 10px)' }}
            >
              <FaUser style={{ fontSize: 'clamp(13px, 2.5vw, 16px)' }} />
              {isAuthenticated ? (
                <FaChevronDown style={{
                  fontSize: '0.55rem',
                  transition: 'transform 0.2s',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                }} />
              ) : (
                <span className="d-none d-sm-inline fs-responsive-sm">Login</span>
              )}
            </button>

            {isAuthenticated && dropdownOpen && (
              <div
                className="shadow"
                style={{
                  position: 'fixed',
                  right: '8px',
                  top: '56px',
                  background: '#fff',
                  borderRadius: '8px',
                  minWidth: '180px',
                  zIndex: 9999,
                  overflow: 'hidden',
                  border: '1px solid #eee',
                }}
              >
                {/* User info */}
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333' }}>{user?.username}</div>
                  <div style={{ fontSize: '0.7rem', color: '#999' }}>{user?.email}</div>
                </div>

                {/* Menu items */}
                <button
                  className="btn btn-link text-decoration-none d-flex align-items-center gap-2 w-100 text-start navbar-dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate('/dashboard') }}
                >
                  <FaTachometerAlt style={{ fontSize: '0.8rem', color: 'var(--theme-primary, #0891B2)' }} />
                  <span>Dashboard</span>
                </button>
                <button
                  className="btn btn-link text-decoration-none d-flex align-items-center gap-2 w-100 text-start navbar-dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate('/notifications') }}
                >
                  <FaBell style={{ fontSize: '0.8rem', color: 'var(--theme-primary, #0891B2)' }} />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Badge pill bg="danger" style={{ fontSize: '0.6rem', marginLeft: 'auto' }}>{unreadCount}</Badge>
                  )}
                </button>
                <div style={{ borderTop: '1px solid #f0f0f0' }}>
                  <button
                    className="btn btn-link text-decoration-none d-flex align-items-center gap-2 w-100 text-start navbar-dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt style={{ fontSize: '0.8rem' }} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </BSNavbar>
  )
}

export default Navbar
