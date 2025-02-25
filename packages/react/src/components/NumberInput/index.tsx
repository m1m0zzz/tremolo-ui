import clsx from 'clsx'
import { ChangeEvent, ComponentPropsWithoutRef, ReactNode } from 'react'

import { clamp, InputEventOption } from '@tremolo-ui/functions'
import { parseValue, Units } from '@tremolo-ui/functions/NumberInput'

/** @category NumberInput */
export interface NumberInputProps {
  value: number

  /**
   * @default Number.MIN_SAFE_INTEGER
   */
  min?: number
  /**
   * @default Number.MAX_SAFE_INTEGER
   */
  max?: number
  step?: number
  defaultValue?: number

  /**
   * @example
   * units='Hz'
   * units={[['Hz', 1], ['kHz', 1000]]}
   * units={[['ms', 1], ['s', 1000]]}
   */
  units?: string | Units

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
  blurOnEnter?: boolean
  keepWithinRange?: boolean
  clampValueOnBlur?: boolean

  // TODO
  /**
   * wheel control option
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   */
  keyboard?: InputEventOption | null

  wrapperClassName?: string

  onChange?: (value: number, event: ChangeEvent<HTMLInputElement>) => void
  onFocus?: (
    value: number,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void
  onBlur?: (
    value: number,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void

  children?: ReactNode
}

/**
 * Input with some useful functions for entering numerical values.
 * @category NumberInput
 */
export function NumberInput({
  value,
  min,
  max,
  step,
  defaultValue,
  units,
  disabled = false,
  digit,
  selectWithFocus = 'none',
  blurOnEnter = true,
  // keepWithinRange = true,
  // clampValueOnBlur = true,
  // wheel = ['raw', 1],
  // keyboard = ['raw', 1],
  wrapperClassName,
  className,
  onChange,
  onFocus,
  onBlur,
  children,
  ...props
}: NumberInputProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof NumberInputProps | 'type'>) {
  console.log(value)
  // const [showValue, setShowValue] = useState()
  // parseValue(String(value), units, digit, defaultValue).formatValue,
  console.log(parseValue(String(value), units, digit, defaultValue))

  return (
    <div
      className={clsx('tremolo-number-input-wrapper', wrapperClassName)}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      data-stepper={!!children}
      onFocus={() => console.log('wrapper focus')}
    >
      <input
        className={clsx('tremolo-number-input', className)}
        value={
          parseValue(String(value), units, digit, defaultValue).formatValue
        }
        min={min}
        max={max}
        step={step}
        type="text"
        disabled={disabled}
        tabIndex={-1}
        onChange={(event) => {
          const v = event.currentTarget.value
          // setShowValue(v)
          const newValue = clamp(
            parseValue(v, units, digit, defaultValue).rawValue,
            min ?? Number.MIN_SAFE_INTEGER,
            max ?? Number.MAX_SAFE_INTEGER,
          )
          if (onChange) onChange(newValue, event)
        }}
        onFocus={(event) => {
          console.log('focus')
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
          // setShowValue(parsed.formatValue)
          if (onBlur) onBlur(parsed.rawValue, event)
        }}
        onKeyDown={(event) => {
          if (blurOnEnter && event.key == 'Enter') {
            event.currentTarget.blur()
          }
        }}
        {...props}
      />
      {children}
    </div>
  )
}

export * from './Stepper'
export * from './IncrementStepper'
export * from './DecrementStepper'
