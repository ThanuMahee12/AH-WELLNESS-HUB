/**
 * Evaluate a value against field rules and return the matching rule.
 *
 * Rule structure:
 *   { operator: '>' | '<' | '>=' | '<=' | '==' | 'between',
 *     value: number,          // for single operators
 *     min: number, max: number, // for 'between'
 *     label: string,          // e.g. 'HIGH', 'LOW', 'NORMAL'
 *     notation: string }      // template e.g. '{label}', '{value} ({label})'
 *
 * @param {number|string} inputValue - The test result value
 * @param {Array} rules - Array of rule objects
 * @returns {{ label: string, notation: string, display: string } | null} - Matched rule or null
 */
export const evaluateRules = (inputValue, rules) => {
  if (!rules || !Array.isArray(rules) || rules.length === 0) return null

  const num = parseFloat(inputValue)
  if (isNaN(num)) return null

  for (const rule of rules) {
    let match = false
    switch (rule.operator) {
      case '>':  match = num > rule.value; break
      case '<':  match = num < rule.value; break
      case '>=': match = num >= rule.value; break
      case '<=': match = num <= rule.value; break
      case '==': match = num === rule.value; break
      case 'between': match = num >= rule.min && num <= rule.max; break
    }
    if (match) return { label: rule.label, notation: rule.notation, display: rule.display }
  }

  return null
}

/**
 * Render notation template by replacing placeholders.
 * Supported: {value}, {label}, {style} (wraps surrounding text with rule's display style)
 *
 * @param {string} notation - Template string e.g. '{label}', '{value} ({label})'
 * @param {string|number} value - The result value
 * @param {string} label - The rule label (e.g. 'HIGH')
 * @returns {string} - Rendered notation text (without {style} marker)
 */
export const renderNotation = (notation, value, label) => {
  if (!notation) return label || ''
  return notation
    .replace(/\{value\}/gi, value ?? '')
    .replace(/\{label\}/gi, label || '')
    .replace(/\{style\}/gi, '')
}

/**
 * Check whether a notation template uses the {style} keyword.
 *
 * @param {string} notation
 * @returns {boolean}
 */
export const hasStyleKeyword = (notation) => {
  return /\{style\}/i.test(notation || '')
}

/**
 * Get inline style object from a display notation (legacy support).
 *
 * @param {string} display - 'I' | 'B' | 'U' | 'IB' | '*'
 * @returns {Object} - React inline style
 */
export const getDisplayStyle = (display) => {
  if (!display || display === '*') return {}
  const style = {}
  if (display.includes('B')) style.fontWeight = 700
  if (display.includes('I')) style.fontStyle = 'italic'
  if (display.includes('U')) style.textDecoration = 'underline'
  return style
}
