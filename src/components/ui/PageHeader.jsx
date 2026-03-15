import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Button } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';

/**
 * Reusable Page Header Component
 */
const PageHeader = React.memo(({
  icon: Icon,
  title,
  subtitle,
  onAddClick,
  addButtonText = 'Add New',
  showAddButton = true,
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div className="d-flex align-items-center gap-2">
        {Icon && <Icon className="text-theme" size={18} />}
        <div>
          <h6 className="mb-0 fw-bold" style={{ fontSize: '1rem' }}>{title}</h6>
          {subtitle && <small className="text-muted" style={{ fontSize: '0.72rem' }}>{subtitle}</small>}
        </div>
      </div>
      {showAddButton && onAddClick && (
        <Button
          size="sm"
          onClick={onAddClick}
          className="btn-theme-add"
          style={{ fontSize: '0.78rem' }}
        >
          <FaPlus className="me-1" size={11} />
          {addButtonText}
        </Button>
      )}
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

PageHeader.propTypes = {
  /** Icon component to display */
  icon: PropTypes.elementType,
  /** Page title (required) */
  title: PropTypes.string.isRequired,
  /** Optional subtitle */
  subtitle: PropTypes.string,
  /** Handler for add button click */
  onAddClick: PropTypes.func,
  /** Text for add button */
  addButtonText: PropTypes.string,
  /** Whether to show add button */
  showAddButton: PropTypes.bool
};

export default PageHeader;
