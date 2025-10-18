/**
 * Serial Number Generator for Checkups
 * Format: 12-digit number based on timestamp with operations
 *
 * Structure:
 * - First 10 digits: Timestamp-based (milliseconds since epoch)
 * - Last 2 digits: Check digits (operation on timestamp)
 */

/**
 * Generate check digits from timestamp
 * Uses modulo and XOR operations for uniqueness
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} - 2 digit check digits
 */
const generateCheckDigits = (timestamp) => {
  // Convert timestamp to string and perform operations
  const timeStr = timestamp.toString()

  // Sum of all digits
  let sum = 0
  for (let i = 0; i < timeStr.length; i++) {
    sum += parseInt(timeStr[i])
  }

  // XOR operation on timestamp parts
  const part1 = parseInt(timeStr.slice(0, 5))
  const part2 = parseInt(timeStr.slice(5))
  const xorResult = part1 ^ part2

  // Combine sum and XOR with modulo
  const checkDigit1 = sum % 10
  const checkDigit2 = xorResult % 10

  return `${checkDigit1}${checkDigit2}`
}

/**
 * Generate a unique 12-digit serial number for checkup
 * @returns {string} - 12 digit serial number
 */
export const generateCheckupSerialNumber = () => {
  const timestamp = Date.now()

  // Get 10 digits from timestamp (remove first 3 digits to fit in 10 digits)
  const timeDigits = timestamp.toString().slice(-10)

  // Generate 2 check digits
  const checkDigits = generateCheckDigits(timestamp)

  // Combine to create 12-digit serial number
  const serialNumber = timeDigits + checkDigits

  return serialNumber
}

/**
 * Validate checkup serial number format
 * @param {string} serialNumber - Serial number to validate
 * @returns {boolean}
 */
export const validateSerialNumber = (serialNumber) => {
  // Check if it's 12 digits
  if (!serialNumber || serialNumber.length !== 12) {
    return false
  }

  // Check if all characters are digits
  if (!/^\d{12}$/.test(serialNumber)) {
    return false
  }

  return true
}

/**
 * Extract timestamp from serial number
 * @param {string} serialNumber - 12 digit serial number
 * @returns {number|null} - Extracted timestamp or null if invalid
 */
export const extractTimestamp = (serialNumber) => {
  if (!validateSerialNumber(serialNumber)) {
    return null
  }

  // Get first 10 digits
  const timeDigits = serialNumber.slice(0, 10)

  // Reconstruct approximate timestamp (won't be exact but close)
  const currentTime = Date.now().toString()
  const prefix = currentTime.slice(0, currentTime.length - 10)

  return parseInt(prefix + timeDigits)
}

/**
 * Format serial number for display
 * Format: XXXX-XXXX-XXXX
 * @param {string} serialNumber - 12 digit serial number
 * @returns {string} - Formatted serial number
 */
export const formatSerialNumber = (serialNumber) => {
  if (!validateSerialNumber(serialNumber)) {
    return serialNumber
  }

  return `${serialNumber.slice(0, 4)}-${serialNumber.slice(4, 8)}-${serialNumber.slice(8, 12)}`
}

/**
 * Generate sequential serial number with counter
 * (Alternative method if strict ordering is needed)
 * @param {number} counter - Sequential counter
 * @returns {string}
 */
export const generateSequentialSerialNumber = (counter) => {
  const timestamp = Date.now()
  const timeDigits = timestamp.toString().slice(-8) // Use 8 digits for time
  const counterDigits = counter.toString().padStart(4, '0') // 4 digits for counter

  return timeDigits + counterDigits
}

/**
 * Verify serial number uniqueness (to be used with database check)
 * @param {string} serialNumber - Serial number to check
 * @param {Array} existingSerialNumbers - Array of existing serial numbers
 * @returns {boolean}
 */
export const isSerialNumberUnique = (serialNumber, existingSerialNumbers) => {
  return !existingSerialNumbers.includes(serialNumber)
}
