import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';

/**
 * Reusable Page Header Component
 * Desktop: "+ Add New" text button inline
 * Mobile: Fixed round "+" FAB at bottom-right
 */
const PageHeader = React.memo(({
  icon: Icon,
  title,
  subtitle,
  onAddClick,
  addButtonText = 'Add New',
  showAddButton = true,
}) => {
  const showFab = showAddButton && onAddClick;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          {Icon && <Icon className="text-theme" size={18} />}
          <div>
            <h6 className="mb-0 fw-bold" style={{ fontSize: '1rem' }}>{title}</h6>
            {subtitle && <small className="text-muted" style={{ fontSize: '0.72rem' }}>{subtitle}</small>}
          </div>
        </div>
        {showFab && (
          <Button
            size="sm"
            onClick={onAddClick}
            className="btn-theme-add d-none d-md-inline-flex align-items-center"
            style={{ fontSize: '0.78rem' }}
          >
            <FaPlus className="me-1" size={11} />
            {addButtonText}
          </Button>
        )}
      </div>

      {/* Mobile FAB */}
      {showFab && (
        <button
          className="d-md-none page-header-fab"
          onClick={onAddClick}
          title={addButtonText}
        >
          <FaPlus size={18} />
        </button>
      )}
    </>
  );
});

PageHeader.displayName = 'PageHeader';

PageHeader.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onAddClick: PropTypes.func,
  addButtonText: PropTypes.string,
  showAddButton: PropTypes.bool
};

export default PageHeader;
