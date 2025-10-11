import { Container, Nav, Navbar as BSNavbar, Button, Badge } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaFlask, FaUser, FaSignOutAlt } from 'react-icons/fa'
import { logout } from '../store/authSlice'

function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector(state => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
      <Container fluid className="px-3 px-md-4">
        <BSNavbar.Brand as={Link} to="/">
          <FaFlask className="me-2" />
          Blood Lab Manager
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-lg-center">
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/patients">Patients</Nav.Link>
                <Nav.Link as={Link} to="/checkups">Checkups</Nav.Link>
                {user?.role === 'admin' && (
                  <>
                    <Nav.Link as={Link} to="/tests">Tests</Nav.Link>
                    <Nav.Link as={Link} to="/users">Users</Nav.Link>
                  </>
                )}
                <Nav.Item className="d-flex align-items-center ms-lg-3">
                  <span className="text-white me-3">
                    <FaUser className="me-2" />
                    {user?.username}
                    {user?.role === 'admin' && (
                      <Badge bg="warning" text="dark" className="ms-2">Admin</Badge>
                    )}
                  </span>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="me-1" /> Logout
                  </Button>
                </Nav.Item>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  )
}

export default Navbar
