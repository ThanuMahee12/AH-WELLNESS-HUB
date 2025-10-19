import { useSelector } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { FaFlask, FaEdit, FaTrash } from 'react-icons/fa'
import { fetchTests, addTest, updateTest, deleteTest, selectAllTests } from '../store/testsSlice'
import { useCRUD } from '../hooks'
import { useNotification } from '../context'
import { PageHeader } from '../components/ui'
import { CRUDTable, CRUDModal } from '../components/crud'
import { PermissionGate, usePermission } from '../components/auth/PermissionGate'

// Form field configuration
const TEST_FIELDS = [
  { name: 'name', label: 'Test Name', type: 'text', required: true, colSize: 6 },
  { name: 'price', label: 'Price (Rs.)', type: 'number', required: true, colSize: 6, props: { step: '0.01' } },
  { name: 'details', label: 'Test Details', type: 'textarea', required: false, colSize: 12, rows: 3 },
  { name: 'rules', label: 'Test Rules/Instructions', type: 'textarea', required: false, colSize: 12, rows: 3 },
];

// Table column configuration
const TABLE_COLUMNS = [
  { key: 'name', label: 'Test Name', render: (value) => <strong>{value}</strong> },
  { key: 'price', label: 'Price (Rs.)', render: (value) => `Rs. ${parseFloat(value).toFixed(2)}` },
  { key: 'details', label: 'Details' },
  { key: 'rules', label: 'Rules' },
];

function Tests() {
  const tests = useSelector(selectAllTests);
  const { loading, error } = useSelector(state => state.tests);
  const { success, error: showError } = useNotification();
  const { checkPermission } = usePermission();

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

  // Custom render actions with permissions
  const renderActions = (item) => (
    <>
      <PermissionGate resource="tests" action="edit">
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
      <PermissionGate resource="tests" action="delete">
        <Button
          size="sm"
          onClick={() => handleDelete(item.id, 'Are you sure you want to delete this test?')}
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

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaFlask}
        title="Blood Tests Management"
        onAddClick={checkPermission('tests', 'create') ? () => handleOpen() : undefined}
        addButtonText="Add New Test"
        showAddButton={checkPermission('tests', 'create')}
      />

      <Row>
        <Col>
          <CRUDTable
            data={tests}
            columns={TABLE_COLUMNS}
            renderActions={renderActions}
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
