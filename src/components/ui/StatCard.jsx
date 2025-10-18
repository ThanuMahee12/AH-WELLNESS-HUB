import React from 'react';
import { Card } from 'react-bootstrap';

/**
 * Reusable Statistics Card Component
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Card value
 * @param {Component} props.icon - Icon component
 * @param {string} props.bgColor - Background color
 * @param {string} props.textColor - Text color
 * @param {string} props.subtitle - Optional subtitle
 */
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  bgColor = 'bg-secondary',
  textColor = 'text-white',
  subtitle,
}) => {
  return (
    <Card className={`${bgColor} ${textColor} shadow-sm border-0`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="mb-1 opacity-75">{title}</p>
            <h3 className="mb-0">{value}</h3>
            {subtitle && <small className="opacity-75">{subtitle}</small>}
          </div>
          {Icon && (
            <div className="opacity-50">
              <Icon size={40} />
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
