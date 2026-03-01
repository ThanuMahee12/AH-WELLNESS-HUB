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
  onAddClick,
  addButtonText = 'Add New',
  showAddButton = true,
}) => {
  return (
    <Row className="mb-4">
      <Col>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h2 className="mb-0">
            {Icon && <Icon className="me-2 text-secondary" />}
            {title}
          </h2>
          {showAddButton && onAddClick && (
            <Button
              onClick={onAddClick}
              className="btn-theme-add"
            >
              <FaPlus className="me-2" />
              {addButtonText}
            </Button>
          )}
        </div>
      </Col>
    </Row>
  );
});

PageHeader.displayName = 'PageHeader';

PageHeader.propTypes = {
  /** Icon component to display */
  icon: PropTypes.elementType,
  /** Page title (required) */
  title: PropTypes.string.isRequired,
  /** Handler for add button click */
  onAddClick: PropTypes.func,
  /** Text for add button */
  addButtonText: PropTypes.string,
  /** Whether to show add button */
  showAddButton: PropTypes.bool
};

export default PageHeader;
