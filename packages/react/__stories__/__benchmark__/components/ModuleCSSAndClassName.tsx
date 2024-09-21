import { ChangeEvent, CSSProperties, useState } from 'react'

import { parseValue, Units } from '../../../src/components/NumberInput/type'

import styles from './styles.module.css'

interface NumberInputProps {
  value: number | string

  min?: number
  max?: number
  step?: number

  // wrapping html input
  disabled?: boolean
  placeholder?: string
  readOnly?: boolean
  tabIndex?: number

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
  selectWithFocus?: 'all' | 'number' | 'none'
  blurWithEnter?: boolean
  className?: string
  style?: CSSProperties
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

export function ModuleCSSAndClassName({
  value,
  // min,
  // max,
  // step,
  units,
  disabled = false,
  placeholder,
  readOnly,
  tabIndex,
  strict = false,
  digit,
  selectWithFocus = 'none',
  blurWithEnter = true,
  className,
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
      className={styles.tremolo_ui_slider + (className ? ` ${className}` : '')}
      value={showValue}
      type={calculatedStrict ? 'number' : 'text'}
      spellCheck={'false'}
      disabled={disabled}
      placeholder={placeholder}
      readOnly={readOnly}
      tabIndex={tabIndex}
      style={style}
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
        // update value
        const v = event.currentTarget.value
        const parsed = parseValue(v, units, digit)
        setShowValue(parsed.formatValue)
        if (onBlur) onBlur(parsed.rawValue, event)
      }}
      onKeyDown={(event) => {
        if (blurWithEnter && event.key == 'Enter') {
          event.currentTarget.blur()
        }
      }}
    />
  )
}
