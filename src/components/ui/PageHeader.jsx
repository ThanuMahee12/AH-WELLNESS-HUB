import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';

/**
 * Reusable Page Header Component
 * @param {Object} props
 * @param {Component} props.icon - Icon component
 * @param {string} props.title - Page title
 * @param {Function} props.onAddClick - Handler for add button
 * @param {string} props.addButtonText - Text for add button
 * @param {boolean} props.showAddButton - Whether to show add button
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
            <Button variant="secondary" onClick={onAddClick}>
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

export default PageHeader;
