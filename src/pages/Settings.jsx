import { useState } from 'react'
import { Container, Tabs, Tab } from 'react-bootstrap'
import { FaCog, FaWpforms, FaTable, FaShieldAlt } from 'react-icons/fa'
import { PageHeader } from '../components/ui'

import FormsSettingsTab from './tabs/FormsSettingsTab'
import TablesSettingsTab from './tabs/TablesSettingsTab'
import PagesSettingsTab from './tabs/PagesSettingsTab'

function Settings() {
  const [activeTab, setActiveTab] = useState('forms')

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaCog}
        title="Settings"
      />

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 tabs-theme"
      >
        <Tab
          eventKey="forms"
          title={
            <span>
              <FaWpforms className="me-2" />
              Form Fields
            </span>
          }
        >
          <FormsSettingsTab />
        </Tab>

        <Tab
          eventKey="tables"
          title={
            <span>
              <FaTable className="me-2" />
              Table Columns
            </span>
          }
        >
          <TablesSettingsTab />
        </Tab>

        <Tab
          eventKey="pages"
          title={
            <span>
              <FaShieldAlt className="me-2" />
              Page Access
            </span>
          }
        >
          <PagesSettingsTab />
        </Tab>
      </Tabs>
    </Container>
  )
}

export default Settings
