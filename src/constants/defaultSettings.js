// Default settings for dynamic form fields and table columns
// This is the single source of truth — Firestore data is deep-merged on top of these defaults

export const ENTITY_LABELS = {
  patients: 'Patients',
  tests: 'Tests',
  medicines: 'Medicines',
  users: 'Users',
  checkups: 'Checkups',
}

// Firebase-compatible field types
export const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text', firebaseType: 'string' },
  { value: 'number', label: 'Number', firebaseType: 'number' },
  { value: 'email', label: 'Email', firebaseType: 'string' },
  { value: 'tel', label: 'Phone', firebaseType: 'string' },
  { value: 'textarea', label: 'Textarea', firebaseType: 'string' },
  { value: 'select', label: 'Dropdown', firebaseType: 'string' },
  { value: 'password', label: 'Password', firebaseType: 'string' },
  { value: 'checkbox', label: 'Checkbox', firebaseType: 'boolean' },
  { value: 'list', label: 'List / Tags', firebaseType: 'array' },
  { value: 'richtext', label: 'Rich Text', firebaseType: 'string' },
  { value: 'date', label: 'Date', firebaseType: 'timestamp' },
  { value: 'custom', label: 'Custom', firebaseType: 'any' },
]

export const ALL_ROLES = ['superadmin', 'maintainer', 'editor', 'user']

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete']
export const PERMISSION_RESOURCES = ['patients', 'tests', 'checkups', 'medicines', 'users']

export const COL_SIZE_OPTIONS = [
  { value: 6, label: 'Half (6)' },
  { value: 12, label: 'Full (12)' },
]

export const DEFAULT_SETTINGS = {
  forms: {
    patients: {
      fields: {
        name: { visible: true, required: true, label: 'Patient Name', type: 'text', colSize: 6, placeholder: '' },
        age: { visible: true, required: true, label: 'Age', type: 'number', colSize: 6, placeholder: '' },
        gender: { visible: true, required: true, label: 'Gender', type: 'custom', colSize: 12, placeholder: '' },
        mobile: { visible: true, required: true, label: 'Mobile', type: 'tel', colSize: 6, placeholder: '' },
        email: { visible: true, required: false, label: 'Email', type: 'email', colSize: 6, placeholder: '' },
        address: { visible: true, required: true, label: 'Address', type: 'textarea', colSize: 12, placeholder: '', rows: 2 },
      },
    },
    tests: {
      fields: {
        code: { visible: true, required: true, label: 'Test Code', type: 'text', colSize: 6, placeholder: 'e.g., S108' },
        name: { visible: true, required: true, label: 'Test Name', type: 'text', colSize: 6, placeholder: '' },
        price: { visible: true, required: true, label: 'Price (Rs.)', type: 'number', colSize: 6, placeholder: '' },
        percentage: { visible: true, required: true, label: 'Commission (%)', type: 'number', colSize: 6, placeholder: '20' },
        details: { visible: true, required: false, label: 'Test Details', type: 'textarea', colSize: 6, placeholder: '', rows: 3 },
        rules: { visible: true, required: false, label: 'Test Rules/Instructions', type: 'textarea', colSize: 6, placeholder: '', rows: 3 },
      },
    },
    medicines: {
      fields: {
        code: { visible: true, required: true, label: 'Medicine Code', type: 'text', colSize: 6, placeholder: 'e.g., MED001' },
        name: { visible: true, required: true, label: 'Medicine Name', type: 'text', colSize: 6, placeholder: '' },
        brand: { visible: true, required: true, label: 'Brand', type: 'text', colSize: 6, placeholder: '' },
        unit: { visible: true, required: true, label: 'Unit', type: 'text', colSize: 6, placeholder: 'e.g., tablets, capsules, ml' },
        dosage: { visible: true, required: true, label: 'Dosage', type: 'list', colSize: 12, placeholder: '' },
        description: { visible: true, required: false, label: 'Description', type: 'textarea', colSize: 12, placeholder: '', rows: 2 },
        details: { visible: true, required: false, label: 'Details', type: 'richtext', colSize: 12, placeholder: '' },
      },
    },
    users: {
      fields: {
        username: { visible: true, required: true, label: 'Username', type: 'text', colSize: 6, placeholder: '' },
        email: { visible: true, required: true, label: 'Email', type: 'email', colSize: 6, placeholder: '' },
        mobile: { visible: true, required: true, label: 'Mobile', type: 'tel', colSize: 6, placeholder: '' },
        role: { visible: true, required: true, label: 'Role', type: 'select', colSize: 6, placeholder: '' },
      },
    },
  },
  pages: {
    dashboard:  { label: 'Dashboard',  roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    patients:   { label: 'Patients',   roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    checkups:   { label: 'Checkups',   roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    tests:      { label: 'Tests',      roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    medicines:  { label: 'Medicines',  roles: ['superadmin', 'maintainer', 'editor'] },
    users:      { label: 'Users',      roles: ['superadmin', 'maintainer'] },
    settings:   { label: 'Settings',   roles: ['superadmin'] },
  },
  permissions: {
    patients: {
      view:   ['superadmin', 'maintainer', 'editor', 'user'],
      create: ['superadmin', 'maintainer', 'editor'],
      edit:   ['superadmin', 'maintainer', 'editor'],
      delete: ['superadmin', 'maintainer'],
    },
    tests: {
      view:   ['superadmin', 'maintainer', 'editor', 'user'],
      create: ['superadmin', 'maintainer', 'editor'],
      edit:   ['superadmin', 'maintainer', 'editor'],
      delete: ['superadmin', 'maintainer'],
    },
    checkups: {
      view:   ['superadmin', 'maintainer', 'editor', 'user'],
      create: ['superadmin', 'maintainer', 'editor'],
      edit:   ['superadmin', 'maintainer', 'editor'],
      delete: ['superadmin', 'maintainer'],
    },
    medicines: {
      view:   ['superadmin', 'maintainer', 'editor'],
      create: ['superadmin', 'maintainer'],
      edit:   ['superadmin', 'maintainer'],
      delete: ['superadmin', 'maintainer'],
    },
    users: {
      view:   ['superadmin', 'maintainer'],
      create: ['superadmin', 'maintainer'],
      edit:   ['superadmin'],
      delete: ['superadmin'],
    },
  },
  tables: {
    patients: {
      itemsPerPage: 10,
      columns: {
        gender: { visible: true, label: '' },
        name: { visible: true, label: 'Name' },
        age: { visible: true, label: 'Age' },
        mobile: { visible: true, label: 'Mobile' },
        address: { visible: true, label: 'Address' },
      },
    },
    tests: {
      itemsPerPage: 10,
      columns: {
        code: { visible: true, label: 'Code' },
        name: { visible: true, label: 'Test Name' },
        price: { visible: true, label: 'Price (Rs.)' },
        percentage: { visible: true, label: 'Commission' },
        details: { visible: true, label: 'Details' },
        rules: { visible: true, label: 'Rules' },
      },
    },
    medicines: {
      itemsPerPage: 10,
      columns: {
        code: { visible: true, label: 'Code' },
        name: { visible: true, label: 'Medicine Name' },
        brand: { visible: true, label: 'Brand' },
        dosage: { visible: true, label: 'Dosage' },
        unit: { visible: true, label: 'Unit' },
        description: { visible: true, label: 'Description' },
      },
    },
    users: {
      itemsPerPage: 10,
      columns: {
        username: { visible: true, label: 'Username' },
        email: { visible: true, label: 'Email' },
        mobile: { visible: true, label: 'Mobile' },
        role: { visible: true, label: 'Role' },
      },
    },
    checkups: {
      itemsPerPage: 10,
      columns: {
        billNo: { visible: true, label: 'Bill No' },
        patientName: { visible: true, label: 'Patient' },
        testNames: { visible: true, label: 'Tests' },
        total: { visible: true, label: 'Total (Rs.)' },
        timestamp: { visible: true, label: 'Date/Time' },
      },
    },
  },
}
