import React, { useState, useMemo } from 'react';
import { Table, Button, Card, Form, Row, Col, Pagination, InputGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

/**
 * Enhanced CRUD Table Component with Pagination, Search, and Sorting
 *
 * @param {Object} props
 * @param {Array} props.data - Array of data items
 * @param {Array} props.columns - Column definitions with sortable flag
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.emptyMessage - Message when no data
 * @param {Function} props.renderActions - Custom actions renderer
 * @param {Function} props.renderCell - Custom cell renderer
 * @param {number} props.itemsPerPage - Items per page (default: 10)
 * @param {Array} props.searchFields - Fields to search in
 */
const EnhancedCRUDTable = React.memo(({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  renderActions,
  renderCell,
  itemsPerPage = 10,
  searchFields = [],
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const searchLower = searchTerm.toLowerCase();
    return data.filter(item => {
      // If searchFields specified, search only those fields
      if (searchFields.length > 0) {
        return searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchLower);
        });
      }

      // Otherwise search all columns
      return columns.some(column => {
        const value = item[column.key];
        return value && String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm, searchFields, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <FaSort className="ms-1" style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'asc'
      ? <FaSortUp className="ms-1" style={{ color: '#0891B2' }} />
      : <FaSortDown className="ms-1" style={{ color: '#0891B2' }} />;
  };

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

  if (loading && data.length === 0) {
    return <LoadingSpinner text="Loading data..." />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <Card className="shadow-sm border-0">
      {/* Search Bar */}
      <Card.Header className="bg-white border-bottom">
        <Row className="align-items-center">
          <Col xs={12} md={6} className="mb-2 mb-md-0">
            <InputGroup>
              <InputGroup.Text style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                <FaSearch style={{ color: '#6c757d' }} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: '1px solid #dee2e6' }}
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSearchTerm('')}
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </InputGroup>
          </Col>
          <Col xs={12} md={6} className="text-md-end">
            <small className="text-muted">
              Showing {paginatedData.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} items
              {searchTerm && ` (filtered from ${data.length} total)`}
            </small>
          </Col>
        </Row>
      </Card.Header>

      {/* Table */}
      <Card.Body className="p-0">
        <Table striped hover responsive className="mb-0 table-mobile-responsive">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.headerClassName || ''}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  style={{
                    cursor: column.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                >
                  {column.label}
                  {column.sortable !== false && getSortIcon(column.key)}
                </th>
              ))}
              {(onEdit || onDelete || renderActions) && (
                <th className="text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-4 text-muted"
                >
                  {searchTerm ? 'No results found' : emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Card.Footer className="bg-white border-top">
          <div className="d-flex justify-content-center align-items-center flex-wrap">
            <Pagination className="mb-0" size="sm">
              <Pagination.First
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              />

              {/* Page numbers */}
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Show first, last, current, and adjacent pages
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <Pagination.Ellipsis key={pageNum} disabled />;
                }
                return null;
              })}

              <Pagination.Next
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        </Card.Footer>
      )}
    </Card>
  );
});

EnhancedCRUDTable.displayName = 'EnhancedCRUDTable';

export default EnhancedCRUDTable;
