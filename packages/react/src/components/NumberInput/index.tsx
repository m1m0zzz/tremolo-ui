import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode, useMemo, useState } from 'react'

import { InputEventOption } from '@tremolo-ui/functions'
import { parseValue, Units } from '@tremolo-ui/functions/NumberInput'

import {
  NumberInputProvider,
  safeClamp,
  useNumberInputContext,
} from './context'

/*
TODO
- onBlurでは、parse + (clamp) + formatして返す
- numberMode: focusが当たった時だけ、parse + type="number"にする
*/

/** @category NumberInput */
export interface NumberInputProps {
  value: number | string

  /**
   * @default Number.MIN_SAFE_INTEGER
   */
  min?: number
  /**
   * @default Number.MAX_SAFE_INTEGER
   */
  max?: number
  step?: number
  defaultValue?: number | string

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

  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled'

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

  onChange?: (value: number, text: string) => void
  onFocus?: (
    value: number,
    text: string,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void
  onBlur?: (
    value: number,
    text: string,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void

  children?: ReactNode
}

function InternalInput({
  min,
  max,
  step,
  defaultValue,
  units,
  disabled,
  digit,
  selectWithFocus,
  blurOnEnter,
  keepWithinRange,
  clampValueOnBlur,
  wheel,
  keyboard,
  wrapperClassName,
  className,
  onChange,
  onFocus,
  onBlur,
  children: _children,
  ...props
}: Omit<NumberInputProps, 'value'> &
  Omit<ComponentPropsWithoutRef<'input'>, keyof NumberInputProps | 'type'>) {
  const [editing, setEditing] = useState(false)
  const value = useNumberInputContext((s) => s.value)
  const valueAsNumber = useNumberInputContext((s) => s.valueAsNumber)
  const change = useNumberInputContext((s) => s.change)

  const error = useMemo(() => {
    if (editing) return false
    const v = valueAsNumber
    return (min ?? -Infinity) > v || v > (max ?? Infinity)
  }, [editing, max, min, valueAsNumber])

  return (
    <input
      className={clsx('tremolo-number-input', className)}
      value={value}
      min={min}
      max={max}
      step={step}
      type="text"
      disabled={disabled}
      tabIndex={-1}
      data-error={error}
      onChange={(event) => {
        const v = event.currentTarget.value
        change(v)
        const valueAsNumber = parseValue(v, units, digit).rawValue
        onChange?.(valueAsNumber, v)
      }}
      onFocus={(event) => {
        setEditing(true)
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
        onFocus?.(parsed.rawValue, parsed.formatValue, event)
      }}
      onBlur={(event) => {
        setEditing(false)
        // update value
        let v = parseValue(event.currentTarget.value, units, digit).rawValue
        if (clampValueOnBlur) {
          v = safeClamp(v, min, max)
        }
        const parsed = parseValue(String(v), units, digit)
        change(parsed.formatValue)
        if (clampValueOnBlur) {
          onChange?.(parsed.rawValue, parsed.formatValue)
        }
        onBlur?.(parsed.rawValue, parsed.formatValue, event)
      }}
      onKeyDown={(event) => {
        if (blurOnEnter && event.key == 'Enter') {
          event.currentTarget.blur()
        }
      }}
      {...props}
    />
  )
}

/**
 * Input with some useful functions for entering numerical values.
 * @category NumberInput
 */
export function NumberInput({
  value,
  min,
  max,
  step = 1,
  defaultValue,
  units,
  disabled = false,
  digit,
  variant = 'outline',
  selectWithFocus = 'none',
  blurOnEnter = true,
  keepWithinRange = true,
  clampValueOnBlur = true,
  wheel = ['raw', 1],
  keyboard = ['raw', 1],
  wrapperClassName,
  className,
  onChange,
  onFocus,
  onBlur,
  children,
  ...props
}: NumberInputProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof NumberInputProps | 'type'>) {
  return (
    <NumberInputProvider
      value={String(value)}
      min={min}
      max={max}
      step={step}
      units={units}
      digit={digit}
      keepWithinRange={keepWithinRange}
      onChange={onChange}
    >
      <div
        className={clsx('tremolo-number-input-wrapper', wrapperClassName)}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        data-stepper={!!children}
        data-variant={variant}
      >
        <InternalInput
          min={min}
          max={max}
          step={step}
          defaultValue={defaultValue}
          units={units}
          disabled={disabled}
          digit={digit}
          selectWithFocus={selectWithFocus}
          blurOnEnter={blurOnEnter}
          keepWithinRange={keepWithinRange}
          clampValueOnBlur={clampValueOnBlur}
          wheel={wheel}
          keyboard={keyboard}
          wrapperClassName={wrapperClassName}
          className={className}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
        {children}
      </div>
    </NumberInputProvider>
  )
}

export * from './Stepper'
export * from './IncrementStepper'
export * from './DecrementStepper'
