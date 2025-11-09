import { Container, Navbar as BSNavbar, Button, Badge } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaUser, FaSignOutAlt } from 'react-icons/fa'
import { logoutUser } from '../store/authSlice'
import bloodLabLogo from '../assets/blood-lab-logo.png'
import '../styles/navbar.css'

function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector(state => state.auth)

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/login')
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

        {isAuthenticated && (
          <div className="d-flex align-items-center ms-auto gap-2">
            <div className="user-info d-flex align-items-center">
              <FaUser className="me-1 me-md-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }} />
              <span className="user-name d-none d-sm-inline" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>{user?.username}</span>
              {user?.role === 'admin' && (
                <Badge bg="warning" text="dark" className="ms-1 ms-md-2" style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)' }}>Admin</Badge>
              )}
            </div>
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleLogout}
              className="logout-btn d-flex align-items-center"
              style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.5rem, 2vw, 0.75rem)',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              <FaSignOutAlt className="me-0 me-md-1" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }} />
              <span className="d-none d-sm-inline">Logout</span>
            </Button>
          </div>
        )}
      </Container>
    </BSNavbar>
  )
}

export default Navbar
