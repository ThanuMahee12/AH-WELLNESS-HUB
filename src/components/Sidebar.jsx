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
  FaCog,
  FaBars,
  FaTimes
} from 'react-icons/fa'
import { useSettings } from '../hooks/useSettings'
import '../styles/sidebar.css'

// Map sidebar paths to page settings keys
const PATH_TO_PAGE_KEY = {
  '/dashboard': 'dashboard',
  '/patients': 'patients',
  '/checkups': 'checkups',
  '/tests': 'tests',
  '/medicines': 'medicines',
  '/users': 'users',
  '/settings': 'settings',
}

function Sidebar() {
  const location = useLocation()
  const { user } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const [showMobile, setShowMobile] = useState(false)

  const menuItems = [
    { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard', fallbackRoles: null },
    { path: '/patients', icon: FaUserInjured, label: 'Patients', fallbackRoles: null },
    { path: '/checkups', icon: FaClipboardCheck, label: 'Checkups', fallbackRoles: null },
    { path: '/tests', icon: FaFlask, label: 'Tests', fallbackRoles: null },
    { path: '/medicines', icon: FaPills, label: 'Medicines', fallbackRoles: ['superadmin', 'maintainer', 'editor'] },
    { path: '/users', icon: FaUsers, label: 'Users', fallbackRoles: ['superadmin', 'maintainer', 'admin'] },
    { path: '/settings', icon: FaCog, label: 'Settings', fallbackRoles: ['superadmin'] },
  ]

  // Filter menu items based on page access settings (with hardcoded fallback)
  const visibleMenuItems = menuItems.filter(item => {
    const pageKey = PATH_TO_PAGE_KEY[item.path]
    const pageRoles = settings?.pages?.[pageKey]?.roles

    if (pageRoles) {
      return pageRoles.includes(user?.role)
    }
    // Fallback to hardcoded roles
    if (item.fallbackRoles) {
      return item.fallbackRoles.includes(user?.role)
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
