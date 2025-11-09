import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Container, Tabs, Tab } from 'react-bootstrap'
import { FaUsers, FaChartLine, FaClipboardList } from 'react-icons/fa'
import { PageHeader } from '../components/ui'

// Import tab components
import UsersTab from './tabs/UsersTab'
import UserActivityTab from './tabs/UserActivityTab'
import UserRequestsTab from './tabs/UserRequestsTab'

function UserManagement() {
  const { user: currentUser } = useSelector(state => state.auth)
  const [activeTab, setActiveTab] = useState('users')

  const isSuperAdmin = currentUser?.role === 'superadmin'

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaUsers}
        title="User Management"
      />

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
        style={{ borderBottom: '2px solid #0891B2' }}
      >
        <Tab
          eventKey="users"
          title={
            <span>
              <FaUsers className="me-2" />
              Users
            </span>
          }
        >
          <UsersTab />
        </Tab>

        {isSuperAdmin && (
          <Tab
            eventKey="activity"
            title={
              <span>
                <FaChartLine className="me-2" />
                Activity
              </span>
            }
          >
            <UserActivityTab />
          </Tab>
        )}

        {isSuperAdmin && (
          <Tab
            eventKey="requests"
            title={
              <span>
                <FaClipboardList className="me-2" />
                Requests
              </span>
            }
          >
            <UserRequestsTab />
          </Tab>
        )}
      </Tabs>
    </Container>
  )
}

export default UserManagement
