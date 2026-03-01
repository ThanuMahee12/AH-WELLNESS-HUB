/**
 * Application configuration constants
 * Centralizes magic numbers and configuration values
 */

// Pagination defaults
export const DEFAULT_ITEMS_PER_PAGE = 10;
export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

// Commission defaults
export const DEFAULT_TEST_COMMISSION_PERCENTAGE = 20;

// PDF configuration
export const PDF_FORMATS = {
  A4: { width: 210, height: 297, label: 'A4' },
  A5: { width: 148, height: 210, label: 'A5' },
  LETTER: { width: 216, height: 279, label: 'Letter' },
  THERMAL_80: { width: 80, height: 297, label: 'Thermal 80mm' },
  THERMAL_58: { width: 58, height: 297, label: 'Thermal 58mm' }
};
export const DEFAULT_PDF_FORMAT = 'A5';

// Date range options for filters
export const DATE_RANGE_OPTIONS = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' }
];

export const PERFORMANCE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' }
];

// Blood groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Gender options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

// Age limits
export const MIN_AGE = 0;
export const MAX_AGE = 120;

// Chart colors (theme colors)
export const CHART_COLORS = {
  primary: '#0891B2',
  secondary: '#06B6D4',
  tertiary: '#22D3EE',
  warning: '#F59E0B',
  success: '#14B8A6',
  danger: '#DC3545'
};

export const PIE_CHART_COLORS = ['#0891B2', '#06B6D4', '#22D3EE', '#F59E0B', '#14B8A6'];

// Debounce delays (in ms)
export const SEARCH_DEBOUNCE_MS = 300;
export const FORM_SAVE_DEBOUNCE_MS = 500;

// API timeouts
export const API_TIMEOUT_MS = 30000;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'ah_wellness_theme',
  SIDEBAR_COLLAPSED: 'ah_wellness_sidebar_collapsed',
  TABLE_ITEMS_PER_PAGE: 'ah_wellness_items_per_page'
};

// Activity log types
export const ACTIVITY_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  VIEW: 'view'
};

// Toast notification durations (in ms)
export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000
};

export default {
  DEFAULT_ITEMS_PER_PAGE,
  ITEMS_PER_PAGE_OPTIONS,
  DEFAULT_TEST_COMMISSION_PERCENTAGE,
  PDF_FORMATS,
  DEFAULT_PDF_FORMAT,
  DATE_RANGE_OPTIONS,
  PERFORMANCE_RANGE_OPTIONS,
  BLOOD_GROUPS,
  GENDER_OPTIONS,
  MIN_AGE,
  MAX_AGE,
  CHART_COLORS,
  PIE_CHART_COLORS,
  SEARCH_DEBOUNCE_MS,
  FORM_SAVE_DEBOUNCE_MS,
  API_TIMEOUT_MS,
  STORAGE_KEYS,
  ACTIVITY_TYPES,
  TOAST_DURATION
};
