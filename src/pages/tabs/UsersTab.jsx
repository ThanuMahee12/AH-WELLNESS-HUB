import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Badge, Button } from 'react-bootstrap'
import { FaPlus } from 'react-icons/fa'
import { fetchUsers, selectAllUsers } from '../../store/usersSlice'
import { EnhancedCRUDTable } from '../../components/crud'
import { usePermission } from '../../components/auth/PermissionGate'

function UsersTab() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const users = useSelector(selectAllUsers);
  const { loading, error } = useSelector(state => state.users);
  const { checkPermission } = usePermission();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const TABLE_COLUMNS = [
    {
      key: 'username',
      label: 'Username',
      render: (value, item) => (
        <strong
          onClick={() => navigate(`/users/${item.id}`)}
          className="clickable-link text-theme"
          style={{ whiteSpace: 'nowrap', opacity: item.disabled ? 0.5 : 1 }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {value}
        </strong>
      )
    },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <Badge className={value === 'admin' ? 'badge-theme' : 'badge-theme-light'}>
          {value}
        </Badge>
      )
    },
  ];

  return (
    <>
      <Row className="mb-3">
        <Col className="d-flex justify-content-end">
          {checkPermission('users', 'create') && (
            <Button
              onClick={() => navigate('/users/new')}
              className="btn-theme-add"
            >
              <FaPlus className="me-2" />
              Add New User
            </Button>
          )}
        </Col>
      </Row>

      <Row>
        <Col>
          <EnhancedCRUDTable
            data={users}
            columns={TABLE_COLUMNS}
            loading={loading}
            error={error}
            emptyMessage="No users found. Add your first user to get started."
            itemsPerPage={10}
            searchFields={['username', 'email', 'mobile', 'role']}
          />
        </Col>
      </Row>
    </>
  );
}

export default UsersTab;
