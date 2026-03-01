import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Breadcrumb as BSBreadcrumb } from 'react-bootstrap'
import { FaHome } from 'react-icons/fa'

/**
 * Reusable Breadcrumb Component
 * @param {Array} items - Array of breadcrumb items [{label, path}]
 * @param {string} current - Current page label (not a link)
 */
const Breadcrumb = ({ items = [], current }) => {
  return (
    <BSBreadcrumb className="mb-3 breadcrumb-theme">
      <BSBreadcrumb.Item linkAs={Link} linkProps={{ to: '/dashboard' }}>
        <FaHome className="me-1" style={{ marginTop: '-2px' }} />
        Home
      </BSBreadcrumb.Item>
      {items.map((item, index) => (
        <BSBreadcrumb.Item
          key={index}
          linkAs={Link}
          linkProps={{ to: item.path }}
        >
          {item.label}
        </BSBreadcrumb.Item>
      ))}
      {current && (
        <BSBreadcrumb.Item active>
          {current}
        </BSBreadcrumb.Item>
      )}
    </BSBreadcrumb>
  )
}

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired
  })),
  current: PropTypes.string
}

export default Breadcrumb
