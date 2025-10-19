import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Form, Button, ButtonGroup } from 'react-bootstrap'
import { FaUserInjured, FaMale, FaFemale, FaUser, FaEdit, FaTrash } from 'react-icons/fa'
import { fetchPatients, addPatient, updatePatient, deletePatient, selectAllPatients } from '../store/patientsSlice'
import { useCRUD } from '../hooks'
import { useNotification } from '../context'
import { PageHeader } from '../components/ui'
import { CRUDTable, CRUDModal } from '../components/crud'
import { PermissionGate, usePermission } from '../components/auth/PermissionGate'

// Custom Gender Icon Selector Component
const GenderIconSelector = ({ value, onChange, name, disabled }) => {
  const genderOptions = [
    { value: 'Male', icon: FaMale, color: '#0891B2' },
    { value: 'Female', icon: FaFemale, color: '#06B6D4' },
    { value: 'Other', icon: FaUser, color: '#0aa2c0' }
  ]

  return (
    <Form.Group className="mb-3">
      <Form.Label>
        Gender <span className="text-danger ms-1">*</span>
      </Form.Label>
      <div className="d-flex gap-3">
        {genderOptions.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          return (
            <Icon
              key={option.value}
              size={28}
              onClick={() => !disabled && onChange({ target: { name, value: option.value } })}
              style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : isSelected ? 1 : 0.4,
                transition: 'opacity 0.2s',
                color: isSelected ? option.color : '#9ca3af'
              }}
            />
          )
        })}
      </div>
    </Form.Group>
  )
}

// Form field configuration (without gender - handled separately)
const PATIENT_FIELDS = [
  { name: 'name', label: 'Patient Name', type: 'text', required: true, colSize: 6 },
  { name: 'age', label: 'Age', type: 'number', required: true, colSize: 6 },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, colSize: 6 },
  { name: 'email', label: 'Email', type: 'email', required: false, colSize: 6 },
  { name: 'address', label: 'Address', type: 'textarea', required: true, colSize: 12, rows: 2 },
];

function Patients() {
  const navigate = useNavigate();
  const patients = useSelector(selectAllPatients);
  const { loading, error } = useSelector(state => state.patients);
  const { success, error: showError } = useNotification();
  const { checkPermission } = usePermission();

  // Table column configuration
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

  // Custom render actions with permissions
  const renderActions = (item) => (
    <>
      <PermissionGate resource="patients" action="edit">
        <Button
          size="sm"
          onClick={() => handleOpen(item)}
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
      </PermissionGate>
      <PermissionGate resource="patients" action="delete">
        <Button
          size="sm"
          onClick={() => handleDelete(item.id, 'Are you sure you want to delete this patient?')}
          style={{
            backgroundColor: 'transparent',
            border: '2px solid #0aa2c0',
            color: '#0aa2c0'
          }}
        >
          <FaTrash className="me-1" />
          Delete
        </Button>
      </PermissionGate>
    </>
  );

  const hasEditOrDelete = checkPermission('patients', 'edit') || checkPermission('patients', 'delete');

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaUserInjured}
        title="Patients Management"
        onAddClick={checkPermission('patients', 'create') ? () => handleOpen() : undefined}
        addButtonText="Add New Patient"
        showAddButton={checkPermission('patients', 'create')}
      />

      <Row>
        <Col>
          <CRUDTable
            data={patients}
            columns={TABLE_COLUMNS}
            renderActions={hasEditOrDelete ? renderActions : undefined}
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
      >
        <Row>
          {PATIENT_FIELDS.slice(0, 2).map((field) => (
            <Col key={field.name} xs={12} md={field.colSize || 6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {field.label}
                  {field.required && <span className="text-danger ms-1">*</span>}
                </Form.Label>
                <Form.Control
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  required={field.required}
                  disabled={isSubmitting}
                />
              </Form.Group>
            </Col>
          ))}
          <Col xs={12}>
            <GenderIconSelector
              value={formData.gender}
              onChange={handleChange}
              name="gender"
              disabled={isSubmitting}
            />
          </Col>
          {PATIENT_FIELDS.slice(2).map((field) => (
            <Col key={field.name} xs={12} md={field.colSize || 6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {field.label}
                  {field.required && <span className="text-danger ms-1">*</span>}
                </Form.Label>
                {field.type === 'textarea' ? (
                  <Form.Control
                    as="textarea"
                    rows={field.rows || 3}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    disabled={isSubmitting}
                  />
                ) : (
                  <Form.Control
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    disabled={isSubmitting}
                  />
                )}
              </Form.Group>
            </Col>
          ))}
        </Row>
      </CRUDModal>
    </Container>
  );
}

export default Patients;
