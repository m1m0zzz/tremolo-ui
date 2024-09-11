/** @jsxImportSource @emotion/react */
import { ChangeEvent, useState } from 'react'

import { BaseElement } from '../../system/BaseElement'
import { UserActionPseudoProps } from '../../system/pseudo'

import { parseValue, Units } from './type'

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
  style,
  onChange,
  onFocus,
  onBlur,
  _active = {},
  _hover = {
    outlineColor: '#bbb',
  },
  _focus = {
    outlineColor: '#4e76e6',
    outlineWidth: 2,
  },
}: NumberInputProps & UserActionPseudoProps) {
  const [showValue, setShowValue] = useState(
    parseValue(String(value), units, digit).formatValue,
  )
  const calculatedStrict = units ? false : strict

  return (
    <BaseElement
      as={'input'}
      className="tremolo-number-input"
      value={showValue}
      type={calculatedStrict ? 'number' : 'text'}
      spellCheck={'false'}
      disabled={disabled}
      placeholder={placeholder}
      readOnly={readOnly}
      tabIndex={tabIndex}
      _active={_active}
      _hover={_hover}
      _focus={_focus}
      style={{
        display: 'inline-block',
        height: '2rem',
        font: 'inherit',
        margin: 0,
        paddingLeft: 10,
        paddingRight: 10,
        outlineColor: 'transparent',
        outlineStyle: 'solid',
        outlineWidth: 1,
        background: 'inherit',
        appearance: 'none',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bbb',
        borderRadius: 4,
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
