import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Container, Tabs, Tab } from 'react-bootstrap'
import { FaCog, FaWpforms, FaTable, FaShieldAlt, FaGlobe, FaStethoscope, FaCommentDots } from 'react-icons/fa'
import { PageHeader } from '../components/ui'
import { useSettings } from '../hooks/useSettings'

import FormsSettingsTab from './tabs/FormsSettingsTab'
import TablesSettingsTab from './tabs/TablesSettingsTab'
import PagesSettingsTab from './tabs/PagesSettingsTab'
import PublicPageTab from './tabs/PublicPageTab'
import CheckupSettingsTab from './tabs/LabResultsSettingsTab'
import FeedbackTab from './tabs/FeedbackTab'

const SETTINGS_TABS = [
  { key: 'forms',  icon: FaWpforms,   component: FormsSettingsTab },
  { key: 'tables', icon: FaTable,     component: TablesSettingsTab },
  { key: 'pages',  icon: FaShieldAlt, component: PagesSettingsTab },
  { key: 'public', icon: FaGlobe,     component: PublicPageTab },
  { key: 'checkup', icon: FaStethoscope, component: CheckupSettingsTab },
  { key: 'feedback', icon: FaCommentDots, component: FeedbackTab },
]

function Settings() {
  const { user } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const [activeTab, setActiveTab] = useState('forms')

  const settingsTabs = settings?.pages?.settings?.tabs || {}

  const canSeeTab = (tabKey) => {
    const tabCfg = settingsTabs[tabKey]
    if (!tabCfg) return user?.role === 'superadmin'
    return tabCfg.roles?.includes(user?.role)
  }

  const visibleTabs = SETTINGS_TABS.filter(t => canSeeTab(t.key))

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaCog}
        title="Settings"
      />

      <Tabs
        activeKey={visibleTabs.some(t => t.key === activeTab) ? activeTab : visibleTabs[0]?.key}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 tabs-theme"
      >
        {visibleTabs.map(({ key, icon: Icon, component: Comp }) => (
          <Tab
            key={key}
            eventKey={key}
            title={
              <span>
                <Icon className="me-2" />
                {settingsTabs[key]?.label || key}
              </span>
            }
          >
            <Comp />
          </Tab>
        ))}
      </Tabs>
    </Container>
  )
}

export default Settings
