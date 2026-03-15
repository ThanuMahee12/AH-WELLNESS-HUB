import { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { FaUserInjured } from 'react-icons/fa'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { PageHeader } from '../components/ui'
import { EnhancedCRUDTable } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'
import { useSettings } from '../hooks'

function Patients() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const patients = useSelector(selectAllPatients);
  const { loading, error } = useSelector(state => state.patients);
  const { checkPermission } = usePermission();
  const { getEntityColumns, getItemsPerPage, getSearchFields } = useSettings();

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  // Custom renderers for specific columns — only rendering logic, not column definitions
  const COLUMN_RENDERERS = useMemo(() => ({
    gender: {
      render: (value) => (
        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{value || '-'}</span>
      )
    },
    name: {
      render: (value, item) => (
        <strong
          onClick={() => navigate(`/patients/${item.id}`)}
          className="clickable-link text-theme"
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {value}
        </strong>
      )
    },
  }), [navigate]);

  const visibleColumns = getEntityColumns('patients', COLUMN_RENDERERS);

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaUserInjured}
        title="Patients Management"
        onAddClick={checkPermission('patients', 'create') ? () => navigate('/patients/new') : undefined}
        addButtonText="Add New Patient"
        showAddButton={checkPermission('patients', 'create')}
      />

      <Row>
        <Col>
          <EnhancedCRUDTable
            data={patients}
            columns={visibleColumns}
            loading={loading}
            error={error}
            emptyMessage="No patients registered yet"
            itemsPerPage={getItemsPerPage('patients')}
            searchFields={getSearchFields('patients')}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Patients;
