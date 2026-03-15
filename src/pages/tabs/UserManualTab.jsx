import { useState } from 'react'
import { Card, Accordion, Badge } from 'react-bootstrap'
import {
  FaUserInjured, FaClipboardCheck, FaFlask, FaPills, FaUsers,
  FaCog, FaFilePdf, FaSignInAlt, FaTachometerAlt, FaBook
} from 'react-icons/fa'

const sections = [
  {
    key: 'login',
    icon: FaSignInAlt,
    title: 'Login & Authentication',
    roles: ['all'],
    content: [
      { step: 'Go to the login page and enter your email and password.' },
      { step: 'Click "Sign In" to access the system.' },
      { step: 'Use "Forgot Password?" to reset your password via email.' },
      { step: 'Your session will expire after inactivity — you will be logged out automatically.' },
    ],
  },
  {
    key: 'dashboard',
    icon: FaTachometerAlt,
    title: 'Dashboard',
    roles: ['all'],
    content: [
      { step: 'View total patients, tests, checkups, revenue, prescriptions, and income at a glance.' },
      { step: 'Use the time range buttons (7d, 30d, 60d, 90d) to filter the Checkups & Revenue chart.' },
      { step: 'The Performance Stats section compares today, yesterday, this week, month, or year.' },
      { step: 'Popular Tests pie chart shows the most frequently performed tests.' },
      { step: 'Monthly Revenue bar chart can be filtered by year.' },
      { step: 'Recent Checkups shows the last 10 checkups with quick view links.' },
    ],
  },
  {
    key: 'patients',
    icon: FaUserInjured,
    title: 'Patient Management',
    roles: ['superadmin', 'maintainer', 'editor'],
    content: [
      { step: 'Navigate to Patients from the sidebar.' },
      { step: 'Click "Add Patient" to create a new patient with name, age, gender, mobile, email, and address.' },
      { step: 'Use the search bar to find patients by name, mobile, or address.' },
      { step: 'Click on a patient row to view their details and checkup history.' },
      { step: 'Edit or delete patients using the action buttons (permissions apply).' },
    ],
  },
  {
    key: 'checkups',
    icon: FaClipboardCheck,
    title: 'Checkups & Billing',
    roles: ['superadmin', 'maintainer', 'editor'],
    content: [
      { step: 'Go to Checkups and click "New Checkup" to start.' },
      { step: 'Step 1: Select an existing patient or create a new one.' },
      { step: 'Step 2: Add tests (search by name/code), medicines, doctor fees, and notes.' },
      { step: 'The system auto-calculates totals and commissions.' },
      { step: 'Save the checkup to generate a bill number.' },
      { step: 'View checkup details to generate PDF Invoice or Prescription.' },
      { step: 'Add general tests (BP, Pulse, Temp, etc.) and lab results from the checkup form.' },
    ],
  },
  {
    key: 'pdf',
    icon: FaFilePdf,
    title: 'PDF Generation',
    roles: ['all'],
    content: [
      { step: 'Open a checkup detail page.' },
      { step: 'Use the "Bill" tab to view and download the invoice PDF.' },
      { step: 'Use the "Prescription" tab to view and download the prescription PDF.' },
      { step: 'PDFs include branded headers, patient info, test/medicine details, and footer.' },
      { step: 'Page size can be configured (A4, A5, thermal receipt, etc.) in Settings.' },
    ],
  },
  {
    key: 'tests',
    icon: FaFlask,
    title: 'Test Management',
    roles: ['superadmin', 'maintainer'],
    content: [
      { step: 'Navigate to Tests from the sidebar.' },
      { step: 'Add new tests with code, name, price, commission percentage, details, and rules.' },
      { step: 'Edit or delete tests as needed.' },
      { step: 'Tests are available in the checkup form for selection.' },
    ],
  },
  {
    key: 'medicines',
    icon: FaPills,
    title: 'Medicine Management',
    roles: ['superadmin', 'maintainer', 'editor'],
    content: [
      { step: 'Navigate to Medicines from the sidebar.' },
      { step: 'Add medicines with code, name, brand, unit, dosage options, and description.' },
      { step: 'Medicines can be added to checkup prescriptions.' },
    ],
  },
  {
    key: 'users',
    icon: FaUsers,
    title: 'User Management',
    roles: ['superadmin', 'maintainer'],
    content: [
      { step: 'Navigate to Users from the sidebar (admin access required).' },
      { step: 'View all users, their roles, and last login information.' },
      { step: 'Create new users or edit existing user details and roles.' },
      { step: 'Superadmin can view Activity logs to track all user actions.' },
      { step: 'Superadmin can approve or reject role change requests in the Requests tab.' },
    ],
  },
  {
    key: 'settings-forms',
    icon: FaCog,
    title: 'Settings — Form Fields',
    roles: ['superadmin'],
    content: [
      { step: 'Go to Settings > Form Fields tab.' },
      { step: 'Select an entity (Patients, Tests, Medicines, Users, Checkups) from the dropdown.' },
      { step: 'Each row shows a field with its label, type, visibility, and required status.' },
      { step: 'Toggle "Visible" to show/hide a field in the form. Hidden fields won\'t appear for any user.' },
      { step: 'Toggle "Required" to make a field mandatory. Required fields must be filled before saving.' },
      { step: 'Click on a field row to open its detail page where you can edit: Label, Placeholder, Field Type (text, number, email, textarea, select, etc.), Column Size (half or full width).' },
      { step: 'To add a new field: Scroll to the bottom of the fields list and use the "Add Field" row. Enter a field key (lowercase, no spaces), set label, type, and save.' },
      { step: 'Field types: Text, Number, Email, Phone, Textarea, Dropdown, Password, Checkbox, List/Tags, Rich Text, Date, Custom.' },
      { step: 'Changes are saved to Firestore and take effect immediately for all users.' },
    ],
  },
  {
    key: 'settings-tables',
    icon: FaCog,
    title: 'Settings — Table Columns',
    roles: ['superadmin'],
    content: [
      { step: 'Go to Settings > Table Columns tab.' },
      { step: 'Select an entity (Patients, Tests, Medicines, Users, Checkups) from the dropdown.' },
      { step: 'Each row shows a column with its label, visibility, searchable status, and allowed roles.' },
      { step: 'Toggle "Visible" to show/hide a column in the table. Hidden columns won\'t display for anyone.' },
      { step: 'Toggle "Searchable" to include/exclude a column from the search filter. When enabled, typing in the search bar will match against this column.' },
      { step: 'Set "Roles" to control which user roles can see the column. For example, set only "superadmin" to hide sensitive columns from other users.' },
      { step: 'Click a column row to edit its detail: change label text, adjust roles, toggle visibility and searchable.' },
      { step: 'Adjust "Items per Page" to change how many rows are shown per page in that table.' },
    ],
  },
  {
    key: 'settings-pages',
    icon: FaCog,
    title: 'Settings — Page Access',
    roles: ['superadmin'],
    content: [
      { step: 'Go to Settings > Page Access tab.' },
      { step: 'Each row represents a page/route in the sidebar.' },
      { step: 'Edit "Label" to change the display name in the sidebar.' },
      { step: 'Change "Icon" to select a different sidebar icon from the dropdown.' },
      { step: 'Set "Order" to control the position of the page in the sidebar (lower = higher).' },
      { step: 'Toggle "Sidebar" to show/hide the page from the sidebar navigation.' },
      { step: 'Set "Roles" to control which user roles can access the page. Removing a role means that user role cannot see or navigate to the page.' },
      { step: 'For pages with tabs (Users, Settings), expand the tabs section to configure each tab\'s label and allowed roles independently.' },
      { step: 'Example: To hide the "Activity" tab from maintainers, remove "maintainer" from the Activity tab\'s roles.' },
    ],
  },
  {
    key: 'settings-public',
    icon: FaCog,
    title: 'Settings — Public Page Control',
    roles: ['superadmin', 'maintainer', 'editor'],
    content: [
      { step: 'Go to Settings > Public Page Control tab. This controls the public-facing home page (visible to everyone, even without login).' },
      { step: '--- HERO SECTION ---', heading: true },
      { step: 'Hero Title: The main heading displayed at the top of the home page (e.g., "AH WELLNESS HUB & ASIRI LABORATORIES").' },
      { step: 'Hero Subtitle: A short description below the title explaining what the system does.' },
      { step: 'Hero Image URL: Paste a direct image URL (e.g., from Imgur, Firebase Storage, or any hosted image). Leave empty to use default.' },
      { step: 'CTA Text: The button text shown to visitors who are NOT logged in (e.g., "Get Started"). This button takes them to the login page.' },
      { step: 'CTA Auth Text: The button text shown to users who ARE logged in (e.g., "Go to Dashboard"). This button takes them to the dashboard.' },
      { step: '--- BLOG / FEATURE CARDS ---', heading: true },
      { step: 'Blog cards appear as a grid on the home page showcasing your services or features.' },
      { step: 'Each card has: Title, Description, Image URL, and a Visible toggle.' },
      { step: 'Click "Add Blog" to create a new card. You can add unlimited cards.' },
      { step: 'Click the eye icon to show/hide a card without deleting it.' },
      { step: 'Click the trash icon to permanently remove a card.' },
      { step: 'Reorder cards by changing their position in the list.' },
      { step: 'Image URL: Use a direct link to an image. Recommended size: 400x300px or similar landscape ratio.' },
      { step: '--- ABOUT SECTION ---', heading: true },
      { step: 'About Title: The heading for the about section (e.g., "About Us").' },
      { step: 'About Description: A detailed paragraph about your organization, services, and mission.' },
      { step: 'About Image URL: An image displayed alongside the about text. Use a direct image link.' },
      { step: 'Toggle "aboutVisible" to show or hide the entire about section on the home page.' },
      { step: '--- CONTACT SECTION ---', heading: true },
      { step: 'Contact Title: The heading for the contact section (e.g., "Contact Us").' },
      { step: 'Contact Fields: Each field has a type (detail or social), label, icon, value, URL, and visible toggle.' },
      { step: 'Phone: Set value to your phone number (e.g., "+94 77 123 4567"). Set URL to "tel:+94771234567" so clicking it makes a call.' },
      { step: 'Email: Set value to your email. Set URL to "mailto:your@email.com" so clicking it opens the mail app.' },
      { step: 'Address: Set value to your physical address. URL can be a Google Maps link to your location.' },
      { step: 'Facebook: Set URL to your Facebook page (e.g., "https://facebook.com/yourpage"). Value is the display text.' },
      { step: 'Instagram: Set URL to your Instagram profile (e.g., "https://instagram.com/yourhandle").' },
      { step: 'WhatsApp: Set URL to "https://wa.me/94771234567" (replace with your number, no spaces or dashes). Clicking it opens WhatsApp chat.' },
      { step: 'Toggle "visible" on each field to show/hide individual contact items.' },
      { step: '--- GOOGLE MAPS EMBED ---', heading: true },
      { step: 'To get a Google Maps embed URL:' },
      { step: '1. Go to Google Maps (maps.google.com) and search for your location.' },
      { step: '2. Click "Share" (the share icon).' },
      { step: '3. Click the "Embed a map" tab.' },
      { step: '4. Click "COPY HTML" to copy the iframe code.' },
      { step: '5. From the copied code, extract ONLY the URL inside src="...". It looks like: https://www.google.com/maps/embed?pb=!1m18!1m12...' },
      { step: '6. Paste that URL (not the full iframe tag) into the "contactMapEmbedUrl" field.' },
      { step: 'The map will appear in the contact section of the home page.' },
      { step: 'Toggle "contactVisible" to show or hide the entire contact section including the map.' },
      { step: '--- IMAGE URLS GUIDE ---', heading: true },
      { step: 'All image fields accept direct URLs to images hosted online. Options to host images:' },
      { step: 'Imgur: Go to imgur.com, upload image, right-click the image and copy the direct image URL (ends in .jpg/.png).' },
      { step: 'Firebase Storage: Upload to Firebase Console > Storage, get the download URL.' },
      { step: 'Any CDN/hosting: Use any publicly accessible image URL that ends with an image extension.' },
      { step: 'Tip: Always use HTTPS URLs for security. Recommended image sizes: Hero (1200x600), Blog (400x300), About (600x400).' },
      { step: 'All changes save to the database and update the public home page instantly.' },
    ],
  },
  {
    key: 'settings-checkup',
    icon: FaCog,
    title: 'Settings — Checkup & PDF',
    roles: ['superadmin'],
    content: [
      { step: 'Go to Settings > Checkup tab.' },
      { step: 'General Tests: Configure vital sign fields (BP, Pulse, Temp, SpO2, RBS, BMI). Toggle visible to show/hide. Set display mode for empty fields (hide, show N/A, show blank).' },
      { step: 'Lab Results: Configure lab result fields (FBS, TC, TG, LDL, HDL, HBA1C, etc.). Same visibility and display options.' },
      { step: 'Add new fields: Enter a field key and label, set order, and save.' },
      { step: 'PDF Invoice Settings: Choose page format (A4, A5, thermal 80mm/58mm, custom). Set width, height, and orientation.' },
      { step: 'PDF Prescription Settings: Same format options for prescription PDFs.' },
      { step: 'PDF Footer: Configure mobile, email, Instagram, Facebook display values. Edit "Thank You" messages for invoice and prescription.' },
      { step: 'E-Signature: Upload or paste a signature image URL for prescriptions. Toggle per-checkup with "Use E-Signature" checkbox.' },
      { step: 'Default Valid Days: Set default prescription validity period (e.g., 30 days).' },
    ],
  },
  {
    key: 'settings-feedback',
    icon: FaCog,
    title: 'Settings — Feedback',
    roles: ['superadmin', 'maintainer', 'editor'],
    content: [
      { step: 'Go to Settings > Public Page tab and scroll to the FEEDBACK section at the bottom.' },
      { step: 'Enter a title summarizing your feedback.' },
      { step: 'Select a category: Bug Report, Feature Request, Improvement, Complaint, or General.' },
      { step: 'Write your detailed message (up to 1000 characters) and click "Submit".' },
      { step: 'Expand "MY FEEDBACKS" to see your submitted feedbacks with status: Pending, Reviewed, or Resolved.' },
      { step: 'When the admin responds, their reply appears below your feedback message.' },
    ],
  },
  {
    key: 'roles',
    icon: FaUsers,
    title: 'Role Permissions',
    roles: ['all'],
    content: [
      { step: 'Superadmin: Full access to all features including settings, user management, and activity logs.' },
      { step: 'Maintainer: Manage tests, medicines, view user requests. All editor permissions.' },
      { step: 'Editor: Manage patients, create/edit checkups, manage medicines. All user permissions.' },
      { step: 'User: View patients and checkups, generate PDF bills and prescriptions.' },
    ],
  },
]

function UserManualTab() {
  const [activeKey, setActiveKey] = useState('login')

  return (
    <Card className="shadow-sm">
      <Card.Header style={{ backgroundColor: '#f8f9fa' }}>
        <h6 className="mb-0"><FaBook className="me-2 text-theme" />User Manual</h6>
      </Card.Header>
      <Card.Body className="p-0">
        <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          <Accordion activeKey={activeKey} onSelect={setActiveKey}>
            {sections.map(section => {
              const Icon = section.icon
              return (
                <Accordion.Item key={section.key} eventKey={section.key}>
                  <Accordion.Header>
                    <div className="d-flex align-items-center gap-2">
                      <Icon className="text-theme" size={14} />
                      <span style={{ fontSize: '0.88rem' }}>{section.title}</span>
                      {section.roles[0] !== 'all' && (
                        <Badge bg="light" text="dark" style={{ fontSize: '0.62rem' }}>
                          {section.roles.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="py-2 px-3">
                    <ol className="mb-0" style={{ fontSize: '0.83rem', paddingLeft: '1.2rem' }}>
                      {section.content.map((item, idx) => (
                        item.heading ? (
                          <li key={idx} className="mb-1 mt-2 fw-bold list-unstyled" style={{ marginLeft: '-1.2rem', color: '#0891B2', fontSize: '0.85rem' }}>
                            {item.step.replace(/^---\s*/, '').replace(/\s*---$/, '')}
                          </li>
                        ) : (
                          <li key={idx} className="mb-1">{item.step}</li>
                        )
                      ))}
                    </ol>
                  </Accordion.Body>
                </Accordion.Item>
              )
            })}
          </Accordion>
        </div>
      </Card.Body>
    </Card>
  )
}

export default UserManualTab
