import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Container } from 'react-bootstrap'
import { FaCog, FaShieldAlt, FaGlobe, FaStethoscope } from 'react-icons/fa'
import { PageHeader, TabLayout } from '../components/ui'
import { useSettings } from '../hooks/useSettings'

import PageControlTab from './tabs/PageControlTab'
import PublicPageTab from './tabs/PublicPageTab'
import CheckupSettingsTab from './tabs/LabResultsSettingsTab'

const SETTINGS_TABS = [
  { key: 'pages', icon: FaShieldAlt, component: PageControlTab },
  { key: 'public', icon: FaGlobe, component: PublicPageTab },
  { key: 'checkup', icon: FaStethoscope, component: CheckupSettingsTab },
]

function Settings() {
  const { user } = useSelector(state => state.auth)
  const { settings } = useSettings()

  const settingsTabs = settings?.pages?.settings?.tabs || {}

  const visibleTabs = useMemo(() => {
    return SETTINGS_TABS
      .filter(t => {
        const tabCfg = settingsTabs[t.key]
        if (!tabCfg) return user?.role === 'superadmin'
        return tabCfg.roles?.includes(user?.role)
      })
      .map(t => ({
        ...t,
        label: settingsTabs[t.key]?.label || t.key.charAt(0).toUpperCase() + t.key.slice(1),
      }))
  }, [settingsTabs, user?.role])

  return (
    <Container fluid className="p-3 p-md-4 d-flex flex-column" style={{ height: 'calc(100vh - 52px)' }}>
      <PageHeader icon={FaCog} title="Settings" />
      <TabLayout tabs={visibleTabs} defaultTab={visibleTabs[0]?.key} />
    </Container>
  )
}

export default Settings
