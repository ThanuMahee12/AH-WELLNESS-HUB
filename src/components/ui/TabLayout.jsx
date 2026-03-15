import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable Tab Layout Component
 * - Fixed tab bar at top (no scroll/shake)
 * - Only content area scrolls
 * - Consistent styling across all pages
 *
 * Props:
 * - tabs: [{ key, label, icon: Component, component: Component, lazy?: boolean }]
 * - defaultTab: string (default active tab key)
 * - className: string (additional class for wrapper)
 */
const TabLayout = React.memo(({ tabs = [], defaultTab, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key)

  const handleTabChange = useCallback((key) => {
    setActiveTab(key)
  }, [])

  if (tabs.length === 0) return null

  const activeTabConfig = tabs.find(t => t.key === activeTab) || tabs[0]
  const ActiveComponent = activeTabConfig?.component

  return (
    <div className={`tab-layout d-flex flex-column ${className}`} style={{ height: '100%', minHeight: 0 }}>
      {/* Fixed Tab Bar */}
      <div className="tab-layout-header flex-shrink-0 border-bottom" style={{ backgroundColor: '#fff' }}>
        <div className="d-flex gap-0 overflow-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                className={`btn btn-link text-decoration-none px-3 py-2 position-relative flex-shrink-0 ${isActive ? 'fw-semibold' : ''}`}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  fontSize: '0.8rem',
                  color: isActive ? '#0891B2' : '#64748b',
                  borderRadius: 0,
                  borderBottom: isActive ? '2px solid #0891B2' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {Icon && <Icon className="me-1" size={13} />}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="tab-layout-content flex-grow-1" style={{ overflow: 'auto', minHeight: 0, padding: '12px 0 0' }}>
        {ActiveComponent && (
          activeTabConfig.lazy
            ? (activeTab === activeTabConfig.key && <ActiveComponent />)
            : <ActiveComponent />
        )}
      </div>
    </div>
  )
})

TabLayout.displayName = 'TabLayout'
TabLayout.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    component: PropTypes.elementType.isRequired,
    lazy: PropTypes.bool,
  })).isRequired,
  defaultTab: PropTypes.string,
  className: PropTypes.string,
}

export default TabLayout
