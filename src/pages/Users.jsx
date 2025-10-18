import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Badge, Alert } from 'react-bootstrap'
import { FaUsers } from 'react-icons/fa'
import { fetchUsers, updateUser, deleteUser, selectAllUsers } from '../store/usersSlice'
import { registerUser } from '../store/authSlice'
import { useCRUD } from '../hooks'
import { useNotification } from '../context'
import { PageHeader } from '../components/ui'
import { CRUDTable, CRUDModal } from '../components/crud'
import { useState } from 'react'

// Form field configuration
const USER_FIELDS = [
  { name: 'username', label: 'Username', type: 'text', required: true, colSize: 6 },
  { name: 'email', label: 'Email', type: 'email', required: true, colSize: 6 },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, colSize: 6 },
  { name: 'role', label: 'Role', type: 'select', required: true, colSize: 6, options: [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' }
  ]},
];

// Table column configuration
const TABLE_COLUMNS = [
  { key: 'username', label: 'Username', render: (value) => <strong>{value}</strong> },
  { key: 'email', label: 'Email' },
  { key: 'mobile', label: 'Mobile' },
  {
    key: 'role',
    label: 'Role',
    render: (value) => (
      <Badge bg={value === 'admin' ? 'warning' : 'info'}>
        {value}
      </Badge>
    )
  },
];

function Users() {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const { loading } = useSelector(state => state.users);
  const { success, error: showError } = useNotification();
  const [formError, setFormError] = useState('');

  // Custom submit handler for Users (special case: uses registerUser for add)
  const handleUserSubmit = async (formData, editingItem) => {
    setFormError('');

    if (editingItem) {
      // Update existing user
      const result = await dispatch(updateUser({ id: editingItem.id, ...formData }));
      if (result.type.includes('fulfilled')) {
        success('User updated successfully!');
        return true;
      } else {
        const errorMsg = result.payload || 'Failed to update user';
        setFormError(errorMsg);
        showError(errorMsg);
        throw new Error(errorMsg);
      }
    } else {
      // Create new user with Firebase Auth
      const result = await dispatch(registerUser(formData));
      if (result.type.includes('fulfilled')) {
        dispatch(fetchUsers()); // Refresh user list
        success('User created successfully!');
        return true;
      } else {
        const errorMsg = result.payload || 'Failed to create user';
        setFormError(errorMsg);
        showError(errorMsg);
        throw new Error(errorMsg);
      }
    }
  };

  const {
    showModal,
    isEditing,
    formData,
    formErrors,
    isSubmitting,
    handleChange,
    handleOpen,
    handleClose,
    handleDelete,
    editingItem,
  } = useCRUD({
    fetchAction: fetchUsers,
    addAction: null, // Handled manually
    updateAction: null, // Handled manually
    deleteAction: deleteUser,
    initialFormState: {
      username: '',
      email: '',
      password: '',
      mobile: '',
      role: 'user',
    },
    onSuccess: (action) => {
      if (action === 'deleted') {
        success('User deleted successfully!');
      }
    },
    onError: (err) => {
      showError(err.message || 'Operation failed');
    },
  });

  // Custom submit handler that uses our special user logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleUserSubmit(formData, editingItem);
      handleClose();
      setFormError('');
    } catch (error) {
      // Error already handled in handleUserSubmit
    }
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaUsers}
        title="Users Management"
        onAddClick={() => handleOpen()}
        addButtonText="Add New User"
      />

      <Row>
        <Col>
          <CRUDTable
            data={users}
            columns={TABLE_COLUMNS}
            onEdit={handleOpen}
            onDelete={(id) => handleDelete(id, 'Are you sure you want to delete this user?')}
            loading={loading}
            emptyMessage="No users found. Add your first user to get started."
          />
        </Col>
      </Row>

      <CRUDModal
        show={showModal}
        title={isEditing ? 'Edit User' : 'Add New User'}
        isEditing={isEditing}
        fields={USER_FIELDS}
        formData={formData}
        formErrors={formErrors}
        onFormChange={handleChange}
        onSubmit={handleSubmit}
        onClose={() => {
          handleClose();
          setFormError('');
        }}
        loading={isSubmitting}
      >
        {formError && <Alert variant="danger" className="mb-3">{formError}</Alert>}

        {/* Password field needs custom handling */}
        <div className="mb-3">
          <label className="form-label">
            Password {!isEditing && <span className="text-danger">*</span>}
          </label>
          <input
            type="password"
            className="form-control"
            name="password"
            value={formData.password || ''}
            onChange={handleChange}
            required={!isEditing}
            placeholder={isEditing ? 'Leave blank to keep current password' : ''}
          />
          {isEditing && (
            <small className="text-muted">Leave blank to keep current password</small>
          )}
        </div>
      </CRUDModal>
    </Container>
  );
}

export default Users;
