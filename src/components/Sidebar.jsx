import { useState, useMemo } from 'react'
import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FaFlask, FaBars, FaTimes } from 'react-icons/fa'
import { useSettings } from '../hooks/useSettings'
import { ICON_MAP } from '../constants/defaultSettings'
import '../styles/sidebar.css'

function Sidebar() {
  const location = useLocation()
  const { user } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const [showMobile, setShowMobile] = useState(false)

  // Build menu items from settings.pages, sorted by order
  const visibleMenuItems = useMemo(() => {
    const pages = settings?.pages
    if (!pages) return []

    return Object.entries(pages)
      .map(([key, cfg]) => ({
        key,
        path: cfg.path || `/${key}`,
        icon: ICON_MAP[cfg.icon] || FaFlask,
        label: cfg.label || key,
        order: cfg.order ?? 99,
        roles: cfg.roles || [],
        sidebar: cfg.sidebar,
      }))
      .filter(item => item.sidebar !== false)
      .filter(item => item.roles.includes(user?.role))
      .sort((a, b) => a.order - b.order)
  }, [settings?.pages, user?.role])

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
