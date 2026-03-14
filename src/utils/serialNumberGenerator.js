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
  const timeStr = timestamp.toString()

  let sum = 0
  for (let i = 0; i < timeStr.length; i++) {
    sum += parseInt(timeStr[i])
  }

  const part1 = parseInt(timeStr.slice(0, 5))
  const part2 = parseInt(timeStr.slice(5))
  const xorResult = part1 ^ part2

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
  const timeDigits = timestamp.toString().slice(-10)
  const checkDigits = generateCheckDigits(timestamp)

  return timeDigits + checkDigits
}
