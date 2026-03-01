import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button, Card } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const CRUDTable = React.memo(({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  renderActions,
  renderCell,
}) => {
  if (loading && data.length === 0) {
    return <LoadingSpinner text="Loading data..." />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  const defaultRenderActions = (item) => (
    <>
      {onEdit && (
        <Button size="sm" onClick={() => onEdit(item)} className="me-2 btn-theme-outline">
          <FaEdit className="me-1" />Edit
        </Button>
      )}
      {onDelete && (
        <Button size="sm" onClick={() => onDelete(item.id)} className="btn-theme-outline-light">
          <FaTrash className="me-1" />Delete
        </Button>
      )}
    </>
  );

  const defaultRenderCell = (item, column) => {
    if (column.render) return column.render(item[column.key], item);
    return item[column.key];
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-0">
        <Table striped hover responsive className="mb-0 table-mobile-responsive">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.headerClassName || ''}>{column.label}</th>
              ))}
              {(onEdit || onDelete || renderActions) && <th className="text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-4 text-muted">{emptyMessage}</td></tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  {columns.map((column) => (
                    <td key={column.key} data-label={column.label} className={column.cellClassName || ''}>
                      {renderCell ? renderCell(item, column) : defaultRenderCell(item, column)}
                    </td>
                  ))}
                  {(onEdit || onDelete || renderActions) && (
                    <td data-label="Actions" className="text-center">
                      {renderActions ? renderActions(item) : defaultRenderActions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
});

CRUDTable.displayName = 'CRUDTable';

CRUDTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    render: PropTypes.func,
    headerClassName: PropTypes.string,
    cellClassName: PropTypes.string
  })).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyMessage: PropTypes.string,
  renderActions: PropTypes.func,
  renderCell: PropTypes.func
};

export default CRUDTable;
