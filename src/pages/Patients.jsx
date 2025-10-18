import { useSelector } from 'react-redux'
import { Container, Row, Col, Form, Button, ButtonGroup } from 'react-bootstrap'
import { FaUserInjured, FaMale, FaFemale, FaUser } from 'react-icons/fa'
import { fetchPatients, addPatient, updatePatient, deletePatient, selectAllPatients } from '../store/patientsSlice'
import { useCRUD } from '../hooks'
import { useNotification } from '../context'
import { PageHeader } from '../components/ui'
import { CRUDTable, CRUDModal } from '../components/crud'

// Custom Gender Icon Selector Component
const GenderIconSelector = ({ value, onChange, name, disabled }) => {
  const genderOptions = [
    { value: 'Male', icon: FaMale, color: 'primary' },
    { value: 'Female', icon: FaFemale, color: 'danger' },
    { value: 'Other', icon: FaUser, color: 'secondary' }
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
              className={isSelected ? `text-${option.color}` : 'text-muted'}
              style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : isSelected ? 1 : 0.4,
                transition: 'opacity 0.2s'
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

// Table column configuration
const TABLE_COLUMNS = [
  {
    key: 'gender',
    label: '',
    render: (value) => {
      if (value === 'Male') {
        return <FaMale className="text-primary" size={18} />
      } else if (value === 'Female') {
        return <FaFemale className="text-danger" size={18} />
      } else {
        return <FaUser className="text-secondary" size={18} />
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
