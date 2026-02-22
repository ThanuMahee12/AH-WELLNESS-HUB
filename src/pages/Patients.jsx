import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { FaUserInjured, FaMale, FaFemale, FaUser } from 'react-icons/fa'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { PageHeader } from '../components/ui'
import { EnhancedCRUDTable } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'

function Patients() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const patients = useSelector(selectAllPatients);
  const { loading, error } = useSelector(state => state.patients);
  const { checkPermission } = usePermission();

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  const TABLE_COLUMNS = [
    {
      key: 'gender',
      label: '',
      render: (value) => {
        if (value === 'Male') {
          return <FaMale style={{ color: '#0891B2' }} size={18} />
        } else if (value === 'Female') {
          return <FaFemale style={{ color: '#06B6D4' }} size={18} />
        } else {
          return <FaUser style={{ color: '#0aa2c0' }} size={18} />
        }
      }
    },
    {
      key: 'name',
      label: 'Name',
      render: (value, item) => (
        <strong
          onClick={() => navigate(`/patients/${item.id}`)}
          style={{
            cursor: 'pointer',
            color: '#0891B2',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {value}
        </strong>
      )
    },
    { key: 'age', label: 'Age' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'address', label: 'Address' },
  ];

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
            columns={TABLE_COLUMNS}
            loading={loading}
            error={error}
            emptyMessage="No patients registered yet"
            itemsPerPage={10}
            searchFields={['name', 'age', 'gender', 'mobile', 'email', 'address']}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Patients;
