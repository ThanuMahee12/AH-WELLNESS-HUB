import { useSelector } from 'react-redux'
import { Container, Row, Col } from 'react-bootstrap'
import { FaFlask } from 'react-icons/fa'
import { fetchTests, addTest, updateTest, deleteTest } from '../store/testsSlice'
import { useCRUD } from '../hooks'
import { useNotification } from '../context'
import { PageHeader } from '../components/ui'
import { CRUDTable, CRUDModal } from '../components/crud'

// Form field configuration
const TEST_FIELDS = [
  { name: 'name', label: 'Test Name', type: 'text', required: true, colSize: 6 },
  { name: 'price', label: 'Price (₹)', type: 'number', required: true, colSize: 6, props: { step: '0.01' } },
  { name: 'details', label: 'Test Details', type: 'textarea', required: false, colSize: 12, rows: 3 },
  { name: 'rules', label: 'Test Rules/Instructions', type: 'textarea', required: false, colSize: 12, rows: 3 },
];

// Table column configuration
const TABLE_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Test Name', render: (value) => <strong>{value}</strong> },
  { key: 'price', label: 'Price (₹)', render: (value) => `₹${parseFloat(value).toFixed(2)}` },
  { key: 'details', label: 'Details' },
  { key: 'rules', label: 'Rules' },
];

function Tests() {
  const { tests, loading, error } = useSelector(state => state.tests);
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
    fetchAction: fetchTests,
    addAction: addTest,
    updateAction: updateTest,
    deleteAction: deleteTest,
    initialFormState: {
      name: '',
      price: '',
      details: '',
      rules: '',
    },
    transformData: (data) => ({
      ...data,
      price: parseFloat(data.price),
    }),
    onSuccess: (action) => {
      success(`Test ${action} successfully!`);
    },
    onError: (err) => {
      showError(err.message || 'Operation failed');
    },
  });

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaFlask}
        title="Blood Tests Management"
        onAddClick={() => handleOpen()}
        addButtonText="Add New Test"
      />

      <Row>
        <Col>
          <CRUDTable
            data={tests}
            columns={TABLE_COLUMNS}
            onEdit={handleOpen}
            onDelete={(id) => handleDelete(id, 'Are you sure you want to delete this test?')}
            loading={loading}
            error={error}
            emptyMessage="No tests available"
          />
        </Col>
      </Row>

      <CRUDModal
        show={showModal}
        title={isEditing ? 'Edit Test' : 'Add New Test'}
        isEditing={isEditing}
        fields={TEST_FIELDS}
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

export default Tests;
