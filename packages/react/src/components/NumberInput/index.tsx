/** @jsxImportSource @emotion/react */
import { ChangeEvent, useState } from 'react'

import { parseValue, Units } from './type'

interface NumberInputProps {
  value: number | string

  min?: number
  max?: number
  disabled?: boolean

  /**
   * @example
   * units={'Hz}
   * units={[['Hz', 1], ['kHz', 1000]]}
   * units={[['ms', 1], ['s', 1000]]}
   */
  units?: string | Units

  /**
   * NOTE: If units is specified, it is forced to `false`
   */
  strict?: boolean

  /**
   * @example
   * with units-{[['Hz', 1], ['kHz', 1000]]}
   * 3 ... 100Hz, 1.60Hz
   */
  digit?: number
  selectWithFocus?: 'all' | 'number'
  style?: React.CSSProperties
  onChange?: (value: number, event: ChangeEvent<HTMLInputElement>) => void
  onFocus?: (
    value: number,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void
  onBlur?: (
    value: number,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void
}

export function NumberInput({
  value,
  // min,
  // max,
  units,
  disabled = false,
  strict = false,
  digit,
  selectWithFocus,
  style,
  onChange,
  onFocus,
  onBlur,
}: NumberInputProps) {
  const [showValue, setShowValue] = useState(
    parseValue(String(value), units, digit).formatValue,
  )
  const calculatedStrict = units ? false : strict

  return (
    <input
      className="tremolo-ui-number-input"
      value={showValue}
      type={calculatedStrict ? 'number' : 'text'}
      spellCheck={'false'}
      disabled={disabled}
      style={{
        display: 'inline-block',
        height: '2rem',
        font: 'inherit',
        paddingLeft: 10,
        paddingRight: 10,
        outline: 'none',
        ...style,
      }}
      onChange={(event) => {
        const v = event.currentTarget.value
        setShowValue(v)
        if (onChange) onChange(parseValue(v, units, digit).rawValue, event)
      }}
      onFocus={(event) => {
        const v = event.currentTarget.value
        const parsed = parseValue(v, units, digit)
        if (selectWithFocus == 'all') {
          event.currentTarget.setSelectionRange(0, v.length)
        } else if (selectWithFocus == 'number') {
          event.currentTarget.setSelectionRange(
            0,
            parsed.formatValue.length - parsed.unit.length,
          )
        }
        if (onFocus) onFocus(parsed.rawValue, event)
      }}
      onBlur={(event) => {
        const v = event.currentTarget.value
        const parsed = parseValue(v, units, digit)
        setShowValue(parsed.formatValue)
        if (onBlur) onBlur(parsed.rawValue, event)
      }}
    />
  )
}
