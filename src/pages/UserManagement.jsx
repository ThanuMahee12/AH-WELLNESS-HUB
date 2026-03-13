import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Container, Tabs, Tab } from 'react-bootstrap'
import { FaUsers, FaChartLine, FaClipboardList } from 'react-icons/fa'
import { PageHeader } from '../components/ui'
import { useSettings } from '../hooks/useSettings'

// Import tab components
import UsersTab from './tabs/UsersTab'
import UserActivityTab from './tabs/UserActivityTab'
import UserRequestsTab from './tabs/UserRequestsTab'

function UserManagement() {
  const { user: currentUser } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const [activeTab, setActiveTab] = useState('users')

  const userTabs = settings?.pages?.users?.tabs || {}
  const canSeeTab = (tabKey) => {
    const tabCfg = userTabs[tabKey]
    if (!tabCfg) return currentUser?.role === 'superadmin'
    return tabCfg.roles?.includes(currentUser?.role)
  }

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaUsers}
        title="User Management"
      />

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 tabs-theme"
      >
        {canSeeTab('users') && (
          <Tab
            eventKey="users"
            title={
              <span>
                <FaUsers className="me-2" />
                {userTabs.users?.label || 'Users'}
              </span>
            }
          >
            <UsersTab />
          </Tab>
        )}

        {canSeeTab('activity') && (
          <Tab
            eventKey="activity"
            title={
              <span>
                <FaChartLine className="me-2" />
                {userTabs.activity?.label || 'Activity'}
              </span>
            }
          >
            {activeTab === 'activity' && <UserActivityTab />}
          </Tab>
        )}

        {canSeeTab('requests') && (
          <Tab
            eventKey="requests"
            title={
              <span>
                <FaClipboardList className="me-2" />
                {userTabs.requests?.label || 'Requests'}
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
