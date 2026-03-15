import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Form, Pagination, Dropdown } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaSortUp, FaSortDown, FaSort, FaSortAmountDown, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

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

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const searchLower = searchTerm.toLowerCase();
    return data.filter(item => {
      const fields = searchFields.length > 0 ? searchFields : columns.map(c => c.key);
      return fields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm, searchFields, columns]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm]);

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
    if (sortConfig.key !== columnKey) return <FaSort className="ms-1" style={{ opacity: 0.2 }} size={10} />;
    return sortConfig.direction === 'asc'
      ? <FaSortUp className="ms-1 text-theme" size={10} />
      : <FaSortDown className="ms-1 text-theme" size={10} />;
  };

  const sortableColumns = columns.filter(col => col.sortable !== false);
  const getCurrentSortLabel = () => {
    if (!sortConfig.key) return 'Sort by...';
    const column = columns.find(c => c.key === sortConfig.key);
    return `${column?.label || sortConfig.key} ${sortConfig.direction === 'asc' ? '↑' : '↓'}`;
  };

  const hasActions = onEdit || onDelete || renderActions;
  const colCount = columns.length + (hasActions ? 1 : 0);

  const defaultRenderActions = (item) => (
    <div className="d-flex gap-1 justify-content-center">
      {onEdit && (
        <button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(item)} style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
          <FaEdit size={11} />
        </button>
      )}
      {onDelete && (
        <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item.id)} style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
          <FaTrash size={11} />
        </button>
      )}
    </div>
  );

  const defaultRenderCell = (item, column) => {
    if (column.render) return column.render(item[column.key], item);
    return item[column.key];
  };

  if (loading && data.length === 0) return <LoadingSpinner text="Loading data..." />;
  if (error) return <ErrorAlert message={error} />;

  const thStyle = {
    padding: '8px 12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f8f9fa',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  return (
    <Card className="shadow-sm border-0 d-flex flex-column" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Fixed Search Header */}
      <div className="py-2 px-3 border-bottom flex-shrink-0">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="position-relative" style={{ minWidth: '200px', maxWidth: '320px', flex: 1 }}>
            <FaSearch className="position-absolute text-muted" size={12} style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              style={{ paddingLeft: 30, fontSize: '0.8rem', border: '1px solid #e2e8f0', borderRadius: 6 }}
            />
            {searchTerm && (
              <button
                className="btn btn-link position-absolute p-0 text-muted"
                style={{ right: 8, top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setSearchTerm('')}
              >
                <FaTimes size={11} />
              </button>
            )}
          </div>
          <small className="text-muted" style={{ fontSize: '0.72rem' }}>
            {sortedData.length > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, sortedData.length)}` : '0'} of {sortedData.length}
            {searchTerm && ` (${data.length} total)`}
          </small>
        </div>

        {/* Mobile Sort */}
        {sortableColumns.length > 0 && (
          <div className="d-md-none mt-2">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm" className="w-100" style={{ fontSize: '0.75rem' }}>
                <FaSortAmountDown className="me-1" size={11} />
                {getCurrentSortLabel()}
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100" style={{ fontSize: '0.8rem' }}>
                {sortConfig.key && (
                  <>
                    <Dropdown.Item onClick={() => setSortConfig({ key: null, direction: null })} className="text-muted">Clear sort</Dropdown.Item>
                    <Dropdown.Divider />
                  </>
                )}
                {sortableColumns.map(col => (
                  <React.Fragment key={col.key}>
                    <Dropdown.Item onClick={() => setSortConfig({ key: col.key, direction: 'asc' })} active={sortConfig.key === col.key && sortConfig.direction === 'asc'}>
                      {col.label} ↑
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setSortConfig({ key: col.key, direction: 'desc' })} active={sortConfig.key === col.key && sortConfig.direction === 'desc'}>
                      {col.label} ↓
                    </Dropdown.Item>
                  </React.Fragment>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        )}
      </div>

      {/* Fixed Table Header */}
      <div className="flex-shrink-0" style={{ overflowX: 'auto' }}>
        <table className="table mb-0" style={{ fontSize: '0.82rem', tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.headerClassName || ''}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ ...thStyle, cursor: col.sortable !== false ? 'pointer' : 'default', userSelect: 'none' }}
                >
                  {col.label}
                  {col.sortable !== false && getSortIcon(col.key)}
                </th>
              ))}
              {hasActions && (
                <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}>Actions</th>
              )}
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable Table Body */}
      <div className="flex-grow-1" style={{ overflow: 'auto', minHeight: 0 }}>
        <table className="table table-hover mb-0 table-mobile-responsive" style={{ fontSize: '0.82rem', tableLayout: 'fixed', width: '100%' }}>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="text-center py-4 text-muted" style={{ fontSize: '0.82rem' }}>
                  {searchTerm ? 'No results found' : emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {columns.map(col => (
                    <td key={col.key} data-label={col.label} className={col.cellClassName || ''} style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                      {renderCell ? renderCell(item, col) : defaultRenderCell(item, col)}
                    </td>
                  ))}
                  {hasActions && (
                    <td data-label="Actions" style={{ padding: '8px 12px', verticalAlign: 'middle', width: '80px' }}>
                      {renderActions ? renderActions(item) : defaultRenderActions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fixed Pagination Footer — always rendered to prevent layout shift */}
      <div className="py-2 px-3 border-top bg-white flex-shrink-0">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>
            {totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : `${sortedData.length} items`}
          </small>
          {totalPages > 1 ? (
            <Pagination className="mb-0" size="sm">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
              <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return <Pagination.Item key={p} active={p === currentPage} onClick={() => setCurrentPage(p)}>{p}</Pagination.Item>;
                }
                if (p === currentPage - 2 || p === currentPage + 2) {
                  return <Pagination.Ellipsis key={p} disabled />;
                }
                return null;
              })}
              <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
              <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
          ) : (
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
              {sortedData.length} of {data.length}
            </small>
          )}
        </div>
      </div>
    </Card>
  );
});

EnhancedCRUDTable.displayName = 'EnhancedCRUDTable';
EnhancedCRUDTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    sortable: PropTypes.bool,
    render: PropTypes.func
  })).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyMessage: PropTypes.string,
  renderActions: PropTypes.func,
  renderCell: PropTypes.func,
  itemsPerPage: PropTypes.number,
  searchFields: PropTypes.arrayOf(PropTypes.string)
};

export default EnhancedCRUDTable;
