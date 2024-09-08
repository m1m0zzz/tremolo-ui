import { useState } from 'react'

import { parseValue, Units } from './type'

interface NumberInputProps {
  value: number

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
  style?: React.CSSProperties

  onChange?: (value: number) => void
  onBlur?: (value: number) => void
}

type CustomHTMLInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'onBlur' | 'style'
>

export function NumberInput({
  value,
  units,
  strict = false,
  onChange,
  onBlur,
  style,
  ...props
}: NumberInputProps & CustomHTMLInputProps) {
  const [showValue, setShowValue] = useState(
    parseValue(String(value), units).formatValue,
  )
  const calculatedStrict = units ? false : strict

  const { type, ...other } = props

  return (
    <input
      className="tremolo-ui-number-input"
      value={showValue}
      type={calculatedStrict ? 'number' : 'text'}
      onChange={(event) => {
        const v = event.currentTarget.value
        setShowValue(v)
        if (onChange) onChange(parseValue(v, units).rawValue)
      }}
      onBlur={(event) => {
        const v = event.currentTarget.value
        const parsed = parseValue(v, units)
        setShowValue(parsed.formatValue)
        if (onBlur) onBlur(parsed.rawValue)
      }}
      style={{
        display: 'inline-block',
        font: 'inherit',
        padding: 10,
        outline: 'none',
        ...style,
      }}
      {...other}
    />
  )
}
