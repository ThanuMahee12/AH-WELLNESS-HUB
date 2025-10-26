import { useSelector } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { FaPills, FaEdit, FaTrash } from 'react-icons/fa'
import { fetchMedicines, addMedicine, updateMedicine, deleteMedicine, selectAllMedicines } from '../store/medicinesSlice'
import { useCRUD } from '../hooks'
import { useNotification } from '../context'
import { PageHeader } from '../components/ui'
import { EnhancedCRUDTable, CRUDModal } from '../components/crud'
import { PermissionGate, usePermission } from '../components/auth/PermissionGate'

// Form field configuration
const MEDICINE_FIELDS = [
  { name: 'code', label: 'Medicine Code', type: 'text', required: true, colSize: 6, placeholder: 'e.g., MED001' },
  { name: 'name', label: 'Medicine Name', type: 'text', required: true, colSize: 6 },
  { name: 'brand', label: 'Brand', type: 'text', required: true, colSize: 6 },
  { name: 'unit', label: 'Unit', type: 'text', required: true, colSize: 6, placeholder: 'e.g., mg, ml, tablets' },
  { name: 'quantity', label: 'Quantity', type: 'text', required: true, colSize: 6 },
  { name: 'description', label: 'Description', type: 'textarea', required: false, colSize: 12, rows: 2 },
  { name: 'details', label: 'Details (Meta - Not shown in table)', type: 'richtext', required: false, colSize: 12, height: '150px' },
];

// Table column configuration - details field excluded from table
const TABLE_COLUMNS = [
  {
    key: 'code',
    label: 'Code',
    render: (value) => (
      <strong style={{
        color: '#0891B2',
        whiteSpace: 'nowrap',
        fontSize: 'clamp(0.85rem, 2vw, 1rem)'
      }}>
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
        maxWidth: '200px',
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
    key: 'quantity',
    label: 'Quantity',
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
        maxWidth: '250px',
        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
        lineHeight: '1.4'
      }}>
        {value || '-'}
      </div>
    )
  },
];

function Medicines() {
  const medicines = useSelector(selectAllMedicines);
  const { loading, error } = useSelector(state => state.medicines);
  const { success, error: showError } = useNotification();
  const { checkPermission } = usePermission();

  // Custom validation for unique code field
  const validateForm = (data, isEdit, editingId) => {
    const errors = {};

    // Check if code is unique
    const codeExists = medicines.find(medicine =>
      medicine.code?.toLowerCase() === data.code?.toLowerCase() &&
      medicine.id !== editingId
    );

    if (codeExists) {
      errors.code = `Medicine code "${data.code}" already exists. Please use a unique code.`;
    }

    return errors;
  };

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
    fetchAction: fetchMedicines,
    addAction: addMedicine,
    updateAction: updateMedicine,
    deleteAction: deleteMedicine,
    initialFormState: {
      code: '',
      name: '',
      brand: '',
      unit: '',
      quantity: '',
      description: '',
      details: '',
    },
    transformData: (data) => ({
      ...data,
      // quantity stays as string, no conversion needed
    }),
    customValidation: validateForm,
    onSuccess: (action) => {
      success(`Medicine ${action} successfully!`);
    },
    onError: (err) => {
      showError(err.message || 'Operation failed');
    },
  });

  // Custom render actions with permissions
  const renderActions = (item) => (
    <>
      <PermissionGate resource="medicines" action="edit">
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
      <PermissionGate resource="medicines" action="delete">
        <Button
          size="sm"
          onClick={() => handleDelete(item.id, 'Are you sure you want to delete this medicine?')}
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

  const hasEditOrDelete = checkPermission('medicines', 'edit') || checkPermission('medicines', 'delete');

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaPills}
        title="Medicines Management"
        onAddClick={checkPermission('medicines', 'create') ? () => handleOpen() : undefined}
        addButtonText="Add New Medicine"
        showAddButton={checkPermission('medicines', 'create')}
      />

      <Row>
        <Col>
          <EnhancedCRUDTable
            data={medicines}
            columns={TABLE_COLUMNS}
            renderActions={hasEditOrDelete ? renderActions : undefined}
            loading={loading}
            error={error}
            emptyMessage="No medicines available"
            itemsPerPage={10}
            searchFields={['code', 'name', 'brand', 'unit', 'description']}
          />
        </Col>
      </Row>

      <CRUDModal
        show={showModal}
        title={isEditing ? 'Edit Medicine' : 'Add New Medicine'}
        isEditing={isEditing}
        fields={MEDICINE_FIELDS}
        formData={formData}
        formErrors={formErrors}
        onFormChange={handleChange}
        onSubmit={handleSubmit}
        onClose={handleClose}
        loading={isSubmitting}
        size="xl"
      />
    </Container>
  );
}

export default Medicines;
