import { useState } from 'react'
import { Form } from 'react-bootstrap'

const DEFAULT_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yest.' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
]

/**
 * Reusable date range picker with preset buttons + custom date inputs.
 *
 * Props:
 * - value: string|number (preset key like 'today', 'week', 7, 30, 'custom', etc.)
 * - onChange: (range, { startDate, endDate }) => void
 *     range = preset key or 'custom'
 *     startDate/endDate only set when range === 'custom'
 * - presets: array of { key, label } — override defaults (custom is auto-appended)
 * - showCustom: boolean — show custom date option (default true)
 * - compact: boolean — smaller styling (default false)
 */
function DateRangePicker({ value = 'month', onChange, presets, showCustom = true, compact = false }) {
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const basePresets = presets || DEFAULT_PRESETS
  const allPresets = showCustom && !basePresets.some(p => p.key === 'custom')
    ? [...basePresets, { key: 'custom', label: 'Custom' }]
    : basePresets

  const handlePreset = (key) => {
    if (key === 'custom') {
      onChange('custom', { startDate: customStart, endDate: customEnd })
    } else {
      onChange(key, {})
    }
  }

  const handleCustomDate = (start, end) => {
    setCustomStart(start)
    setCustomEnd(end)
    if (start && end) {
      onChange('custom', { startDate: start, endDate: end })
    }
  }

  const fontSize = compact ? '0.65rem' : '0.7rem'
  const padding = compact ? '1px 6px' : '2px 8px'

  return (
    <div>
      <div className="d-flex flex-wrap gap-1">
        {allPresets.map(p => (
          <button
            key={p.key}
            className={`btn btn-sm ${value === p.key ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handlePreset(p.key)}
            style={{
              fontSize,
              padding,
              borderRadius: '12px',
              ...(value === p.key ? { backgroundColor: '#0891B2', borderColor: '#0891B2' } : {}),
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div className="d-flex gap-1 mt-1">
          <Form.Control
            type="date"
            size="sm"
            value={customStart}
            onChange={(e) => handleCustomDate(e.target.value, customEnd)}
            style={{ fontSize: '0.72rem' }}
          />
          <Form.Control
            type="date"
            size="sm"
            value={customEnd}
            onChange={(e) => handleCustomDate(customStart, e.target.value)}
            style={{ fontSize: '0.72rem' }}
          />
        </div>
      )}
    </div>
  )
}

export default DateRangePicker
