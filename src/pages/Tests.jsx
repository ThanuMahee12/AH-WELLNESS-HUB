import { useEffect, useMemo } from 'react'
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
  const { getEntityColumns, getItemsPerPage, getSearchFields } = useSettings();

  useEffect(() => {
    dispatch(fetchTests());
  }, [dispatch]);

  const COLUMN_RENDERERS = useMemo(() => ({
    code: {
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
    name: {
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
    price: {
      render: (value) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          Rs. {parseFloat(value).toFixed(2)}
        </span>
      )
    },
    percentage: {
      render: (value) => (
        <span className="text-theme fw-medium" style={{ whiteSpace: 'nowrap' }}>
          {value || 20}%
        </span>
      )
    },
    details: {
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
    rules: {
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
  }), [navigate]);

  const visibleColumns = getEntityColumns('tests', COLUMN_RENDERERS);

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
