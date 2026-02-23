import { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { FaPills } from 'react-icons/fa'
import { fetchMedicines, selectAllMedicines } from '../store/medicinesSlice'
import { PageHeader } from '../components/ui'
import { EnhancedCRUDTable } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'
import { useSettings } from '../hooks'

function Medicines() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const medicines = useSelector(selectAllMedicines);
  const { loading, error } = useSelector(state => state.medicines);
  const { checkPermission } = usePermission();
  const { getEntityColumns, getItemsPerPage, getSearchFields } = useSettings();

  useEffect(() => {
    dispatch(fetchMedicines());
  }, [dispatch]);

  const COLUMN_RENDERERS = useMemo(() => ({
    code: {
      render: (value, item) => (
        <strong
          onClick={() => navigate(`/medicines/${item.id}`)}
          className="clickable-link text-theme fs-responsive-base"
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
          maxWidth: window.innerWidth < 768 ? '120px' : '200px',
          display: 'inline-block',
          fontSize: 'clamp(0.85rem, 2vw, 1rem)'
        }}>
          {value}
        </strong>
      )
    },
    brand: {
      render: (value) => (
        <span style={{
          whiteSpace: 'nowrap',
          fontSize: 'clamp(0.85rem, 2vw, 1rem)'
        }}>
          {value}
        </span>
      )
    },
    dosage: {
      render: (value) => {
        const dosages = Array.isArray(value) ? value : (value ? [value] : [])
        return dosages.length > 0 ? dosages.join(', ') : '-'
      }
    },
    unit: {
      render: (value) => (
        <span style={{
          whiteSpace: 'nowrap',
          fontSize: 'clamp(0.85rem, 2vw, 1rem)'
        }}>
          {value}
        </span>
      )
    },
    description: {
      render: (value) => (
        <div style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          maxWidth: window.innerWidth < 768 ? '120px' : '250px',
          fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
          lineHeight: '1.4'
        }}>
          {value || '-'}
        </div>
      )
    },
  }), [navigate]);

  const visibleColumns = getEntityColumns('medicines', COLUMN_RENDERERS);

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaPills}
        title="Medicines Management"
        onAddClick={checkPermission('medicines', 'create') ? () => navigate('/medicines/new') : undefined}
        addButtonText="Add New Medicine"
        showAddButton={checkPermission('medicines', 'create')}
      />

      <Row>
        <Col>
          <EnhancedCRUDTable
            data={medicines}
            columns={visibleColumns}
            loading={loading}
            error={error}
            emptyMessage="No medicines available"
            itemsPerPage={getItemsPerPage('medicines')}
            searchFields={getSearchFields('medicines')}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Medicines;
