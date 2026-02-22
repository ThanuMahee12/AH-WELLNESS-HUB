import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { FaPills } from 'react-icons/fa'
import { fetchMedicines, selectAllMedicines } from '../store/medicinesSlice'
import { PageHeader } from '../components/ui'
import { EnhancedCRUDTable } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'

function Medicines() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const medicines = useSelector(selectAllMedicines);
  const { loading, error } = useSelector(state => state.medicines);
  const { checkPermission } = usePermission();

  useEffect(() => {
    dispatch(fetchMedicines());
  }, [dispatch]);

  const TABLE_COLUMNS = [
    {
      key: 'code',
      label: 'Code',
      render: (value, item) => (
        <strong
          onClick={() => navigate(`/medicines/${item.id}`)}
          style={{
            color: '#0891B2',
            whiteSpace: 'nowrap',
            fontSize: 'clamp(0.85rem, 2vw, 1rem)',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {value}
        </strong>
      )
    },
    {
      key: 'name',
      label: 'Medicine Name',
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
    {
      key: 'brand',
      label: 'Brand',
      render: (value) => (
        <span style={{
          whiteSpace: 'nowrap',
          fontSize: 'clamp(0.85rem, 2vw, 1rem)'
        }}>
          {value}
        </span>
      )
    },
    {
      key: 'dosage',
      label: 'Dosage',
      render: (value) => {
        const dosages = Array.isArray(value) ? value : (value ? [value] : [])
        return dosages.length > 0 ? dosages.join(', ') : '-'
      }
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (value) => (
        <span style={{
          whiteSpace: 'nowrap',
          fontSize: 'clamp(0.85rem, 2vw, 1rem)'
        }}>
          {value}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Description',
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
  ];

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
            columns={TABLE_COLUMNS}
            loading={loading}
            error={error}
            emptyMessage="No medicines available"
            itemsPerPage={10}
            searchFields={['code', 'name', 'brand', 'unit', 'description']}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Medicines;
