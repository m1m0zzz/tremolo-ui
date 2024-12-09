import { css, CSSObject } from '@emotion/react'
import { clamp } from '@tremolo-ui/functions'
import { parseValue, Units } from '@tremolo-ui/functions/NumberInput'
import { ChangeEvent, useState } from 'react'
import clsx from 'clsx'

import { InputPseudoProps, UserActionPseudoProps } from '../../system/pseudo'

interface NumberInputProps {
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
  style?: CSSObject
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
  strict = false,
  digit,
  selectWithFocus = 'none',
  blurWithEnter = true,
  className,
  style,
  onChange,
  onFocus,
  onBlur,
  ...pseudo
}: NumberInputProps & UserActionPseudoProps & InputPseudoProps) {
  const [showValue, setShowValue] = useState(
    parseValue(String(value), units, digit, defaultValue).formatValue,
  )
  const calculatedStrict = units ? false : strict
  const { _active, _focus, _hover } = pseudo

  return (
    <input
      className={clsx('tremolo-number-input', className)}
      value={showValue}
      min={min}
      max={max}
      step={step}
      type={calculatedStrict ? 'number' : 'text'}
      spellCheck={'false'}
      disabled={disabled}
      placeholder={placeholder}
      readOnly={readOnly}
      tabIndex={tabIndex}
      css={css({
        display: 'block',
        font: 'inherit',
        margin: 0,
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 10,
        paddingRight: 10,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bbb',
        borderRadius: 4,
        outline: 0,
        transition: 'all 0.1s linear',
        appearance: 'textfield',
        '&:hover': {
          borderColor: 'var(--tremolo-theme-color)',
          ..._hover,
        },
        '&:focus': {
          borderColor: 'var(--tremolo-theme-color)',
          boxShadow: '0px 0px 0px 2px rgba(var(--tremolo-theme-color-rgb), 0.1)',
          ..._focus,
        },
        ...(_active && { '&:active': { ..._active } }),
        ...style,
      })}
      onChange={(event) => {
        const v = event.currentTarget.value
        setShowValue(v)
        const newValue = clamp(
          parseValue(v, units, digit, defaultValue).rawValue,
          min ?? -Infinity,
          max ?? Infinity
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
    />
  )
}
