/** @jsxImportSource @emotion/react */
import { ChangeEvent, useState } from 'react'

import { UserActionPseudoProps } from '../../system/pseudo'
import { isEmpty } from '../../util'

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
}: NumberInputProps & Partial<UserActionPseudoProps>) {
  const [showValue, setShowValue] = useState(
    parseValue(String(value), units, digit).formatValue,
  )
  const calculatedStrict = units ? false : strict
  const [overrideStyle, setOverrideStyle] = useState<
    Partial<UserActionPseudoProps>
  >({})

  return (
    <input
      className="tremolo-number-input"
      value={showValue}
      type={calculatedStrict ? 'number' : 'text'}
      spellCheck={'false'}
      disabled={disabled}
      placeholder={placeholder}
      readOnly={readOnly}
      tabIndex={tabIndex}
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
        ...overrideStyle._active,
        ...overrideStyle._hover,
        ...overrideStyle._focus,
      }}
      onChange={(event) => {
        const v = event.currentTarget.value
        setShowValue(v)
        if (onChange) onChange(parseValue(v, units, digit).rawValue, event)
      }}
      onFocus={(event) => {
        // pseudo
        if (!isEmpty(_focus))
          setOverrideStyle({ ...overrideStyle, _focus: _focus })
        // update value
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
        // pseudo
        if (!isEmpty(_focus)) setOverrideStyle({ ...overrideStyle, _focus: {} })
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
      onMouseOver={() => {
        if (!isEmpty(_hover))
          setOverrideStyle({ ...overrideStyle, _hover: _hover })
      }}
      onMouseLeave={() => {
        if (!isEmpty(_hover)) {
          setOverrideStyle({ ...overrideStyle, _hover: {} })
        }
      }}
      onMouseDown={() => {
        if (!isEmpty(_active)) {
          setOverrideStyle({ ...overrideStyle, _active: _active })
        }
      }}
      onMouseUp={() => {
        if (!isEmpty(_active)) {
          setOverrideStyle({ ...overrideStyle, _active: {} })
        }
      }}
    />
  )
}
