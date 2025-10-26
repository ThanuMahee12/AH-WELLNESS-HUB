import { useState } from 'react'
import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  FaTachometerAlt,
  FaUserInjured,
  FaClipboardCheck,
  FaFlask,
  FaPills,
  FaUsers,
  FaBars,
  FaTimes
} from 'react-icons/fa'
import '../styles/sidebar.css'

function Sidebar() {
  const location = useLocation()
  const { user } = useSelector(state => state.auth)
  const [showMobile, setShowMobile] = useState(false)

  const menuItems = [
    { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/patients', icon: FaUserInjured, label: 'Patients' },
    { path: '/checkups', icon: FaClipboardCheck, label: 'Checkups' },
    { path: '/tests', icon: FaFlask, label: 'Tests' },
    { path: '/medicines', icon: FaPills, label: 'Medicines', roles: ['superadmin', 'maintainer', 'editor'] },
    { path: '/users', icon: FaUsers, label: 'Users', roles: ['superadmin', 'maintainer', 'admin'] },
  ]

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => {
    if (item.roles) {
      return item.roles.includes(user?.role)
    }
    return true
  })

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="sidebar-toggle d-lg-none"
        onClick={() => setShowMobile(!showMobile)}
        aria-label="Toggle menu"
      >
        {showMobile ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${showMobile ? 'show' : ''}`}>
        <div className="sidebar-header">
          <FaFlask className="sidebar-logo" />
          <h4 className="sidebar-title">AH WELLNESS HUB</h4>
        </div>

        <Nav className="flex-column sidebar-nav">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setShowMobile(false)}
              >
                <Icon className="sidebar-icon" />
                <span>{item.label}</span>
              </Nav.Link>
            )
          })}
        </Nav>
      </div>

      {/* Mobile Overlay */}
      {showMobile && (
        <div
          className="sidebar-overlay d-lg-none"
          onClick={() => setShowMobile(false)}
        />
      )}
    </>
  )
}

export default Sidebar
