// Default settings for dynamic form fields and table columns
// This is the single source of truth — Firestore data is deep-merged on top of these defaults

import {
  FaTachometerAlt,
  FaUserInjured,
  FaClipboardCheck,
  FaFlask,
  FaPills,
  FaUsers,
  FaCog,
  FaShieldAlt,
  FaHome,
  FaChartBar,
  FaHeart,
  FaStethoscope,
  FaFileMedical,
  FaNotesMedical,
  FaCalendarCheck,
  FaBoxes,
  FaUserMd,
  FaHospital,
  FaClipboardList,
  FaBriefcaseMedical,
  FaBug,
} from 'react-icons/fa'

// Map icon name strings → React Icon components (for DB-driven sidebar)
export const ICON_MAP = {
  FaTachometerAlt,
  FaUserInjured,
  FaClipboardCheck,
  FaFlask,
  FaPills,
  FaUsers,
  FaCog,
  FaShieldAlt,
  FaHome,
  FaChartBar,
  FaHeart,
  FaStethoscope,
  FaFileMedical,
  FaNotesMedical,
  FaCalendarCheck,
  FaBoxes,
  FaUserMd,
  FaHospital,
  FaClipboardList,
  FaBriefcaseMedical,
  FaBug,
}

// Options for the icon dropdown in PageControlTab
export const ICON_OPTIONS = Object.keys(ICON_MAP).map(name => ({
  value: name,
  label: name.replace(/^Fa/, '').replace(/([A-Z])/g, ' $1').trim(),
}))

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
        gender: { visible: true, required: true, label: 'Gender', type: 'select', colSize: 6, placeholder: '', options: ['Male', 'Female', 'Other'] },
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
    checkups: {
      fields: {
        tests: { visible: true, required: true, label: 'Tests', type: 'custom', colSize: 12, placeholder: 'Search tests by name or code...' },
        ownTests: { visible: true, required: false, label: 'Own Tests', type: 'checkbox', colSize: 12, placeholder: '' },
        doctorFees: { visible: true, required: false, label: 'Doctor Fees (Rs.)', type: 'number', colSize: 6, placeholder: 'Enter doctor fees' },
        paid: { visible: true, required: false, label: 'Paid', type: 'checkbox', colSize: 12, placeholder: '' },
        weight: { visible: true, required: false, label: 'Weight (kg)', type: 'number', colSize: 6, placeholder: 'Enter weight in kg (optional)' },
        height: { visible: true, required: false, label: 'Height (cm)', type: 'number', colSize: 6, placeholder: 'Enter height in cm (optional)' },
        notes: { visible: true, required: false, label: 'Invoice Notes', type: 'textarea', colSize: 12, placeholder: 'Add general notes for the invoice...' },
        commonNotes: { visible: true, required: false, label: 'Common Notes', type: 'richtext', colSize: 12, placeholder: 'Add common notes for this checkup...' },
        testNotes: { visible: true, required: false, label: 'Test Notes', type: 'custom', colSize: 12, placeholder: '' },
        prescription: { visible: true, required: false, label: 'Prescription', type: 'custom', colSize: 12, placeholder: '' },
        prescriptionNotes: { visible: true, required: false, label: 'Prescription Notes', type: 'textarea', colSize: 12, placeholder: 'Additional instructions for the prescription...' },
        validDays: { visible: true, required: false, label: 'Prescription Valid Days', type: 'number', colSize: 6, placeholder: '30' },
        useESign: { visible: true, required: false, label: 'Use E-Signature', type: 'checkbox', colSize: 6, placeholder: '' },
        generalTests: { visible: true, required: false, label: 'General Tests', type: 'custom', colSize: 12, placeholder: '' },
        labResults: { visible: true, required: false, label: 'Lab Results', type: 'custom', colSize: 12, placeholder: '' },
      },
    },
  },
  pages: {
    login: {
      label: 'Login', path: '/login', sidebar: false,
      showResetPassword: ['superadmin', 'maintainer', 'editor', 'user'],
      showSignUp: [],
      content: {
        brandTitle: '',
        brandSubtitle: '',
        brandFeatures: [],
        loginTitle: '',
        loginSubtitle: '',
        forgotTitle: '',
        forgotSubtitle: '',
        signupTitle: '',
        signupSubtitle: '',
      },
    },
    home: {
      label: 'Home', icon: 'FaHome', path: '/', order: 0,
      sidebar: false,
      roles: ['superadmin', 'maintainer', 'editor', 'user'],
      content: {
        navbarBrand: '',
        heroBadge: '',
        heroTitle: '',
        heroSubtitle: '',
        heroImageUrl: '',
        ctaText: '',
        ctaAuthText: '',
        ctaLink: '/login',
        ctaAuthLink: '/dashboard',
        ctaVisible: true,
        ctaAuthVisible: true,
        featuresBadge: '',
        featuresTitle: '',
        blogs: [],
        aboutBadge: '',
        aboutTitle: '',
        aboutDescription: '',
        aboutImageUrl: '',
        aboutVisible: true,
        contactBadge: '',
        contactTitle: '',
        contactFields: [],
        contactMapEmbedUrl: '',
        contactVisible: true,
      },
    },
    dashboard:  { label: 'Dashboard',  icon: 'FaTachometerAlt',  path: '/dashboard',  order: 1, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    patients:   { label: 'Patients',   icon: 'FaUserInjured',    path: '/patients',   order: 2, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    checkups:   { label: 'Checkups',   icon: 'FaClipboardCheck',  path: '/checkups',  order: 3, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    tests:      { label: 'Tests',      icon: 'FaFlask',           path: '/tests',     order: 4, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    medicines:  { label: 'Medicines',  icon: 'FaPills',           path: '/medicines', order: 5, roles: ['superadmin', 'maintainer', 'editor'] },
    appointments: { label: 'Appointments', icon: 'FaCalendarCheck', path: '/appointments', order: 6, roles: ['superadmin', 'maintainer', 'editor'] },
    users: {
      label: 'Users', icon: 'FaUsers', path: '/users', order: 7,
      roles: ['superadmin', 'maintainer'],
      tabs: {
        users:    { label: 'Users',    roles: ['superadmin', 'maintainer'] },
        activity: { label: 'Activity', roles: ['superadmin'] },
        requests: { label: 'Requests', roles: ['superadmin'] },
        manual: { label: 'User Manual', roles: ['superadmin', 'maintainer', 'editor', 'user'] },
      },
    },
    settings: {
      label: 'Settings', icon: 'FaCog', path: '/settings', order: 8,
      roles: ['superadmin', 'maintainer', 'editor'],
      tabs: {
        pages:  { label: 'Page Control',          roles: ['superadmin'] },
        public: { label: 'Public Page',           roles: ['superadmin', 'maintainer', 'editor'] },
        checkup: { label: 'Checkup', roles: ['superadmin'] },
      },
    },
    maintenance: {
      label: 'Maintenance', icon: 'FaBug', path: '/maintenance', order: 9,
      roles: ['superadmin'],
    },
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
  notifications: {
    role_request_submitted: { enabled: true, roles: ['superadmin'] },
    role_request_approved: { enabled: true, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    role_request_rejected: { enabled: true, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    system_release: { enabled: true, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    appointment_created: { enabled: true, roles: ['superadmin', 'maintainer', 'editor'] },
    appointment_approved: { enabled: true, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
    appointment_rejected: { enabled: true, roles: ['superadmin', 'maintainer', 'editor', 'user'] },
  },
  checkupPdf: {
    header: {
      invoiceTitle: '',
      prescriptionTitle: '',
      subtitle: '',
    },
    invoice: { format: 'custom', width: 80, height: 200, orientation: 'portrait' },
    prescription: { format: 'a5', width: 148, height: 210, orientation: 'portrait' },
    footer: {
      mobile: { label: 'Mobile', value: '', visible: true },
      email: { label: 'Email', value: '', visible: true },
      instagram: { label: 'IG', value: '', visible: true },
      facebook: { label: 'FB', value: '', visible: true },
      thankYouInvoice: '',
      thankYouPrescription: '',
    },
    eSign: '',
    defaultValidDays: 30,
    defaultDoctorFees: 0,
    appointmentNotify: {
      whatsapp: { enabled: false, number: '' },
      email: { enabled: false, address: '' },
    },
  },
  generalTests: {
    showEmpty: 'hide',
    fields: {
      bp:      { label: 'BP', visible: true, order: 1 },
      pulse:   { label: 'Pulse', visible: true, order: 2 },
      temp:    { label: 'Temp', visible: true, order: 3 },
      spo2:    { label: 'SpO2', visible: true, order: 4 },
      rbs:     { label: 'RBS', visible: true, order: 5 },
      bmi:     { label: 'BMI', visible: true, order: 6 },
    },
  },
  labResults: {
    showEmpty: 'hide',
    fields: {
      ht:      { label: 'Ht', visible: true, order: 1 },
      wt:      { label: 'Wt', visible: true, order: 2 },
      fbs:     { label: 'FBS', visible: true, order: 3 },
      tc:      { label: 'TC', visible: true, order: 4 },
      tg:      { label: 'TG', visible: true, order: 5 },
      ldl:     { label: 'LDL', visible: true, order: 6 },
      vldl:    { label: 'VLDL', visible: true, order: 7 },
      hdl:     { label: 'HDL', visible: true, order: 8 },
      bu:      { label: 'BU', visible: true, order: 9 },
      scr:     { label: 'SCr', visible: true, order: 10 },
      egfr:    { label: 'eGFR', visible: true, order: 11 },
      ufrAlb:  { label: 'UFR Alb', visible: true, order: 12, children: ['sug', 'p', 'r'] },
      sug:     { label: 'Sug', visible: true, order: 13, parent: 'ufrAlb' },
      p:       { label: 'P', visible: true, order: 14, parent: 'ufrAlb' },
      r:       { label: 'R', visible: true, order: 15, parent: 'ufrAlb' },
      hb:      { label: 'Hb', visible: true, order: 16 },
      esr:     { label: 'ESR', visible: true, order: 17 },
      crp:     { label: 'CRP', visible: true, order: 18 },
      hba1c:   { label: 'HBA1C', visible: true, order: 19 },
      na:      { label: 'Na', visible: true, order: 20 },
      k:       { label: 'K', visible: true, order: 21 },
      sgot:    { label: 'SGOT', visible: true, order: 22 },
      sgpt:    { label: 'SGPT', visible: true, order: 23 },
      ggt:     { label: 'GGT', visible: true, order: 24 },
      tsh:     { label: 'TSH', visible: true, order: 25 },
      vitd:    { label: 'VitD', visible: true, order: 26 },
      psa:     { label: 'PSA', visible: true, order: 27 },
    },
  },
  tables: {
    patients: {
      itemsPerPage: 10,
      columns: {
        name: { visible: true, label: 'Name', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        gender: { visible: true, label: 'Gender', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        age: { visible: true, label: 'Age', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        mobile: { visible: true, label: 'Mobile', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        address: { visible: true, label: 'Address', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
      },
    },
    tests: {
      itemsPerPage: 10,
      columns: {
        code: { visible: true, label: 'Code', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        name: { visible: true, label: 'Test Name', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        price: { visible: true, label: 'Price (Rs.)', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        percentage: { visible: true, label: 'Commission', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        details: { visible: true, label: 'Details', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        rules: { visible: true, label: 'Rules', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
      },
    },
    medicines: {
      itemsPerPage: 10,
      columns: {
        code: { visible: true, label: 'Code', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        name: { visible: true, label: 'Medicine Name', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        brand: { visible: true, label: 'Brand', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        dosage: { visible: true, label: 'Dosage', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        unit: { visible: true, label: 'Unit', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        description: { visible: true, label: 'Description', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
      },
    },
    users: {
      itemsPerPage: 10,
      columns: {
        username: { visible: true, label: 'Username', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        email: { visible: true, label: 'Email', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        mobile: { visible: true, label: 'Mobile', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        role: { visible: true, label: 'Role', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
      },
    },
    checkups: {
      itemsPerPage: 10,
      columns: {
        billNo: { visible: true, label: 'Bill No', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        patientName: { visible: true, label: 'Patient', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        testNames: { visible: true, label: 'Tests', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        total: { visible: true, label: 'Total (Rs.)', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
        timestamp: { visible: true, label: 'Date/Time', roles: ['superadmin', 'maintainer', 'editor', 'user'], searchable: true },
      },
    },
  },
}
