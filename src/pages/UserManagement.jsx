import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Container } from 'react-bootstrap'
import { FaUsers, FaChartLine, FaClipboardList, FaBook } from 'react-icons/fa'
import { PageHeader, TabLayout } from '../components/ui'
import { useSettings } from '../hooks/useSettings'

import UsersTab from './tabs/UsersTab'
import UserActivityTab from './tabs/UserActivityTab'
import UserRequestsTab from './tabs/UserRequestsTab'
import UserManualTab from './tabs/UserManualTab'

const USER_TABS = [
  { key: 'users', icon: FaUsers, component: UsersTab },
  { key: 'activity', icon: FaChartLine, component: UserActivityTab, lazy: true },
  { key: 'requests', icon: FaClipboardList, component: UserRequestsTab },
  { key: 'manual', icon: FaBook, component: UserManualTab },
]

function UserManagement() {
  const { user: currentUser } = useSelector(state => state.auth)
  const { settings } = useSettings()

  const userTabs = settings?.pages?.users?.tabs || {}

  const visibleTabs = useMemo(() => {
    return USER_TABS
      .filter(t => {
        const tabCfg = userTabs[t.key]
        if (!tabCfg) return currentUser?.role === 'superadmin'
        return tabCfg.roles?.includes(currentUser?.role)
      })
      .map(t => ({
        ...t,
        label: userTabs[t.key]?.label || t.key.charAt(0).toUpperCase() + t.key.slice(1),
      }))
  }, [userTabs, currentUser?.role])

  return (
    <Container fluid className="p-3 p-md-4 d-flex flex-column" style={{ height: 'calc(100vh - 52px)' }}>
      <PageHeader icon={FaUsers} title="User Management" />
      <TabLayout tabs={visibleTabs} defaultTab="users" />
    </Container>
  )
}

export default UserManagement
