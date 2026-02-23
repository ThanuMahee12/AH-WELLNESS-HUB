import { Container, Navbar as BSNavbar, Button, Badge } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaUser, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa'
import { logoutUser } from '../store/authSlice'
import bloodLabLogo from '../assets/blood-lab-logo.png'
import NotificationBell from './NotificationBell'
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

        {isAuthenticated ? (
          <div className="d-flex align-items-center ms-auto gap-2">
            <div
              className="user-info d-flex align-items-center"
              onClick={() => navigate('/dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <FaUser className="me-1 me-md-2 fs-responsive-base" />
              <span className="user-name d-none d-sm-inline fs-responsive-base">{user?.username}</span>
              {user?.role === 'admin' && (
                <Badge bg="warning" text="dark" className="ms-1 ms-md-2 fs-responsive-sm">Admin</Badge>
              )}
            </div>
            <NotificationBell />
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleLogout}
              className="logout-btn d-flex align-items-center touch-target fs-responsive-sm"
            >
              <FaSignOutAlt className="me-0 me-md-1 fs-responsive-base" />
              <span className="d-none d-sm-inline">Logout</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="outline-light"
            size="sm"
            onClick={() => navigate('/login')}
            className="logout-btn d-flex align-items-center ms-auto touch-target fs-responsive-sm"
          >
            <FaSignInAlt className="me-0 me-md-1 fs-responsive-base" />
            <span className="d-none d-sm-inline">Login</span>
          </Button>
        )}
      </Container>
    </BSNavbar>
  )
}

export default Navbar
