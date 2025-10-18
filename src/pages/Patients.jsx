import { useSelector } from 'react-redux'
import { Container, Row, Col } from 'react-bootstrap'
import { FaUserInjured, FaMale, FaFemale, FaUser } from 'react-icons/fa'
import { fetchPatients, addPatient, updatePatient, deletePatient, selectAllPatients } from '../store/patientsSlice'
import { useCRUD } from '../hooks'
import { useNotification } from '../context'
import { PageHeader } from '../components/ui'
import { CRUDTable, CRUDModal } from '../components/crud'

// Form field configuration
const PATIENT_FIELDS = [
  { name: 'name', label: 'Patient Name', type: 'text', required: true, colSize: 6 },
  { name: 'age', label: 'Age', type: 'number', required: true, colSize: 3 },
  { name: 'gender', label: 'Gender', type: 'select', required: true, colSize: 3, options: ['Male', 'Female', 'Other'] },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, colSize: 6 },
  { name: 'email', label: 'Email', type: 'email', required: false, colSize: 6 },
  { name: 'address', label: 'Address', type: 'textarea', required: true, colSize: 12, rows: 2 },
];

// Table column configuration
const TABLE_COLUMNS = [
  {
    key: 'gender',
    label: 'Gender',
    render: (value) => {
      if (value === 'Male') {
        return <FaMale className="text-primary" size={20} title="Male" />
      } else if (value === 'Female') {
        return <FaFemale className="text-danger" size={20} title="Female" />
      } else {
        return <FaUser className="text-secondary" size={20} title="Other" />
      }
    }
  },
  { key: 'name', label: 'Name', render: (value) => <strong>{value}</strong> },
  { key: 'age', label: 'Age' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email', render: (value) => value || '-' },
  { key: 'address', label: 'Address' },
];

function Patients() {
  const patients = useSelector(selectAllPatients);
  const { loading, error } = useSelector(state => state.patients);
  const { success, error: showError } = useNotification();

  // Custom hook handles ALL CRUD operations, modal, and form state
  const {
    showModal,
    isEditing,
    formData,
    formErrors,
    isSubmitting,
    handleChange,
    handleOpen,
    handleClose,
    handleSubmit,
    handleDelete,
  } = useCRUD({
    fetchAction: fetchPatients,
    addAction: addPatient,
    updateAction: updatePatient,
    deleteAction: deletePatient,
    initialFormState: {
      name: '',
      age: '',
      gender: 'Male',
      mobile: '',
      address: '',
      email: '',
    },
    transformData: (data) => ({
      ...data,
      age: parseInt(data.age),
    }),
    onSuccess: (action) => {
      success(`Patient ${action} successfully!`);
    },
    onError: (err) => {
      showError(err.message || 'Operation failed');
    },
  });

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaUserInjured}
        title="Patients Management"
        onAddClick={() => handleOpen()}
        addButtonText="Add New Patient"
      />

      <Row>
        <Col>
          <CRUDTable
            data={patients}
            columns={TABLE_COLUMNS}
            onEdit={handleOpen}
            onDelete={(id) => handleDelete(id, 'Are you sure you want to delete this patient?')}
            loading={loading}
            error={error}
            emptyMessage="No patients registered yet"
          />
        </Col>
      </Row>

      <CRUDModal
        show={showModal}
        title={isEditing ? 'Edit Patient' : 'Add New Patient'}
        isEditing={isEditing}
        fields={PATIENT_FIELDS}
        formData={formData}
        formErrors={formErrors}
        onFormChange={handleChange}
        onSubmit={handleSubmit}
        onClose={handleClose}
        loading={isSubmitting}
      />
    </Container>
  );
}

export default Patients;
