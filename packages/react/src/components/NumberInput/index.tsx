import clsx from 'clsx'
import { ChangeEvent, ComponentPropsWithoutRef, useState } from 'react'

import { clamp } from '@tremolo-ui/functions'
import { parseValue, Units } from '@tremolo-ui/functions/NumberInput'

export interface NumberInputProps {
  value: number | string

  min?: number
  max?: number
  step?: number
  defaultValue?: number

  // wrapping html input
  disabled?: boolean
  placeholder?: string
  readOnly?: boolean
  tabIndex?: number

  /**
   * @example
   * units='Hz'
   * units={[['Hz', 1], ['kHz', 1000]]}
   * units={[['ms', 1], ['s', 1000]]}
   */
  units?: string | Units

  /**
   * NOTE: If units is specified, it is forced to `false`
   */
  typeNumber?: boolean

  /**
   * Digits for rounding numbers.
   * @example
   * with:
   * units={[['Hz', 1], ['kHz', 1000]]}
   * digit={3}
   * results:
   * value=100 -> 100Hz, value=1600 -> 1.60Hz
   */
  digit?: number
  selectWithFocus?: 'all' | 'number' | 'none'
  blurWithEnter?: boolean
  className?: string
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

/**
 * Input with some useful functions for entering numerical values.
 */
export function NumberInput({
  value,
  min,
  max,
  step,
  defaultValue = min,
  units,
  disabled = false,
  placeholder,
  readOnly,
  tabIndex,
  typeNumber = false,
  digit,
  selectWithFocus = 'none',
  blurWithEnter = true,
  className,
  onChange,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof NumberInputProps | 'type'>) {
  const [showValue, setShowValue] = useState(
    parseValue(String(value), units, digit, defaultValue).formatValue,
  )
  const calculatedTypeNumber = units ? false : typeNumber

  return (
    <input
      className={clsx('tremolo-number-input', className)}
      value={showValue}
      min={min}
      max={max}
      step={step}
      type={calculatedTypeNumber ? 'number' : 'text'}
      spellCheck={'false'}
      disabled={disabled}
      placeholder={placeholder}
      readOnly={readOnly}
      tabIndex={tabIndex}
      onChange={(event) => {
        const v = event.currentTarget.value
        setShowValue(v)
        const newValue = clamp(
          parseValue(v, units, digit, defaultValue).rawValue,
          min ?? -Infinity,
          max ?? Infinity,
        )
        if (onChange) onChange(newValue, event)
      }}
      onFocus={(event) => {
        const v = event.currentTarget.value
        const parsed = parseValue(v, units, digit, defaultValue)
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
        const parsed = parseValue(v, units, digit, defaultValue)
        setShowValue(parsed.formatValue)
        if (onBlur) onBlur(parsed.rawValue, event)
      }}
      onKeyDown={(event) => {
        if (blurWithEnter && event.key == 'Enter') {
          event.currentTarget.blur()
        }
      }}
      {...props}
    />
  )
}
