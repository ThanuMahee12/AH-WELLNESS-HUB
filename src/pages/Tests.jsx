import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { FaFlask } from 'react-icons/fa'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { PageHeader } from '../components/ui'
import { EnhancedCRUDTable } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'
import { useSettings } from '../hooks'

function Tests() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tests = useSelector(selectAllTests);
  const { loading, error } = useSelector(state => state.tests);
  const { checkPermission } = usePermission();
  const { filterColumns, getItemsPerPage, getSearchFields } = useSettings();

  useEffect(() => {
    dispatch(fetchTests());
  }, [dispatch]);

  const TABLE_COLUMNS = [
    {
      key: 'code',
      label: 'Code',
      render: (value, item) => (
        <strong
          onClick={() => navigate(`/tests/${item.id}`)}
          className="clickable-link text-theme"
          style={{ whiteSpace: 'nowrap' }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {value}
        </strong>
      )
    },
    {
      key: 'name',
      label: 'Test Name',
      render: (value) => (
        <strong style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          maxWidth: window.innerWidth < 768 ? '150px' : '250px',
          display: 'inline-block'
        }}>
          {value}
        </strong>
      )
    },
    {
      key: 'price',
      label: 'Price (Rs.)',
      render: (value) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          Rs. {parseFloat(value).toFixed(2)}
        </span>
      )
    },
    {
      key: 'percentage',
      label: 'Commission',
      align: 'center',
      render: (value) => (
        <span className="text-theme fw-medium" style={{ whiteSpace: 'nowrap' }}>
          {value || 20}%
        </span>
      )
    },
    {
      key: 'details',
      label: 'Details',
      render: (value) => (
        <div style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          maxWidth: window.innerWidth < 768 ? '120px' : '200px'
        }}>
          {value}
        </div>
      )
    },
    {
      key: 'rules',
      label: 'Rules',
      render: (value) => (
        <div style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          maxWidth: window.innerWidth < 768 ? '120px' : '200px'
        }}>
          {value}
        </div>
      )
    },
  ];

  const visibleColumns = filterColumns('tests', TABLE_COLUMNS);

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaFlask}
        title="Blood Tests Management"
        onAddClick={checkPermission('tests', 'create') ? () => navigate('/tests/new') : undefined}
        addButtonText="Add New Test"
        showAddButton={checkPermission('tests', 'create')}
      />

      <Row>
        <Col>
          <EnhancedCRUDTable
            data={tests}
            columns={visibleColumns}
            loading={loading}
            error={error}
            emptyMessage="No tests available"
            itemsPerPage={getItemsPerPage('tests')}
            searchFields={getSearchFields('tests')}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Tests;
