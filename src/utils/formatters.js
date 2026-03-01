/**
 * Utility functions for formatting data
 * Centralizes all formatting logic for consistency across the app
 */

/**
 * Format price with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'LKR')
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, currency = 'LKR') => {
  if (amount === null || amount === undefined) return 'Rs. 0.00';

  const formatted = Number(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `Rs. ${formatted}`;
};

/**
 * Format date to locale string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return dateObj.toLocaleDateString('en-LK', defaultOptions);
};

/**
 * Format date with time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  return dateObj.toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';

  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Format Sri Lankan mobile numbers
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  return phone;
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format bill number with padding
 * @param {number|string} billNo - Bill number
 * @param {number} padding - Number of digits to pad
 * @returns {string} Formatted bill number
 */
export const formatBillNo = (billNo, padding = 6) => {
  if (!billNo) return '';
  return String(billNo).padStart(padding, '0');
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(dateObj);
};

export default {
  formatPrice,
  formatDate,
  formatDateTime,
  formatPhone,
  formatPercentage,
  truncateText,
  formatBillNo,
  getRelativeTime
};
