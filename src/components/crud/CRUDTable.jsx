import React from 'react';
import { Table, Button, Card } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

/**
 * Reusable CRUD Table Component
 * Handles responsive tables with edit/delete actions
 *
 * @param {Object} props
 * @param {Array} props.data - Array of data items
 * @param {Array} props.columns - Column definitions
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.emptyMessage - Message when no data
 * @param {Function} props.renderActions - Custom actions renderer
 * @param {Function} props.renderCell - Custom cell renderer
 */
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
        <Button
          size="sm"
          onClick={() => onEdit(item)}
          className="me-2"
          style={{
            backgroundColor: 'transparent',
            border: '2px solid #0891B2',
            color: '#0891B2'
          }}
        >
          <FaEdit className="me-1" />
          Edit
        </Button>
      )}
      {onDelete && (
        <Button
          size="sm"
          onClick={() => onDelete(item.id)}
          style={{
            backgroundColor: 'transparent',
            border: '2px solid #0aa2c0',
            color: '#0aa2c0'
          }}
        >
          <FaTrash className="me-1" />
          Delete
        </Button>
      )}
    </>
  );

  const defaultRenderCell = (item, column) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }
    return item[column.key];
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-0">
        <Table striped hover responsive className="mb-0 table-mobile-responsive">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.headerClassName || ''}>
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete || renderActions) && (
                <th className="text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-4 text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      data-label={column.label}
                      className={column.cellClassName || ''}
                    >
                      {renderCell
                        ? renderCell(item, column)
                        : defaultRenderCell(item, column)}
                    </td>
                  ))}
                  {(onEdit || onDelete || renderActions) && (
                    <td data-label="Actions" className="text-center">
                      {renderActions
                        ? renderActions(item)
                        : defaultRenderActions(item)}
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

export default CRUDTable;
