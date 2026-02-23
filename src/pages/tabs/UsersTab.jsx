import { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Badge, Button } from 'react-bootstrap'
import { FaPlus } from 'react-icons/fa'
import { fetchUsers, selectAllUsers } from '../../store/usersSlice'
import { EnhancedCRUDTable } from '../../components/crud'
import { usePermission } from '../../components/auth/PermissionGate'
import { useSettings } from '../../hooks'

function UsersTab() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const users = useSelector(selectAllUsers);
  const { loading, error } = useSelector(state => state.users);
  const { checkPermission } = usePermission();
  const { getEntityColumns, getItemsPerPage, getSearchFields } = useSettings();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const COLUMN_RENDERERS = useMemo(() => ({
    username: {
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
    role: {
      render: (value) => (
        <Badge className={value === 'admin' ? 'badge-theme' : 'badge-theme-light'}>
          {value}
        </Badge>
      )
    },
  }), [navigate]);

  const visibleColumns = getEntityColumns('users', COLUMN_RENDERERS);

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
            columns={visibleColumns}
            loading={loading}
            error={error}
            emptyMessage="No users found. Add your first user to get started."
            itemsPerPage={getItemsPerPage('users')}
            searchFields={getSearchFields('users')}
          />
        </Col>
      </Row>
    </>
  );
}

export default UsersTab;
