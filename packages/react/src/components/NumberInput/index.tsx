import { css, CSSObject } from '@emotion/react'
import { parseValue, Units } from '@tremolo-ui/functions/components/NumberInput/type'
import { ChangeEvent, useState } from 'react'
import clsx from 'clsx'

import { InputPseudoProps, UserActionPseudoProps } from '../../system/pseudo'

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
  min, // TODO
  max, // TODO
  step, // TODO
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
    parseValue(String(value), units, digit).formatValue,
  )
  const calculatedStrict = units ? false : strict
  const { _active, _focus, _hover } = pseudo

  return (
    <input
      className={clsx('tremolo-number-input', className)}
      value={showValue}
      type={calculatedStrict ? 'number' : 'text'}
      spellCheck={'false'}
      disabled={disabled}
      placeholder={placeholder}
      readOnly={readOnly}
      tabIndex={tabIndex}
      css={css({
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
        '&:hover': {
          outlineColor: '#bbb',
          ..._hover,
        },
        '&:focus': {
          outlineColor: '#4e76e6',
          outlineWidth: 2,
          ..._focus,
        },
        ...(_active && { '&:active': { ..._active } }),
        ...style,
      })}
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
