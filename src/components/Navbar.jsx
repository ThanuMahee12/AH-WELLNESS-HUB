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
          <div className="d-flex align-items-center ms-auto">
            <div className="user-info me-3">
              <FaUser className="me-2" />
              <span className="user-name d-none d-md-inline">{user?.username}</span>
              {user?.role === 'admin' && (
                <Badge bg="warning" text="dark" className="ms-2">Admin</Badge>
              )}
            </div>
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleLogout}
              className="logout-btn"
            >
              <FaSignOutAlt className="me-1" />
              <span className="d-none d-md-inline">Logout</span>
            </Button>
          </div>
        )}
      </Container>
    </BSNavbar>
  )
}

export default Navbar
