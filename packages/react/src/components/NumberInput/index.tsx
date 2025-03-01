import clsx from 'clsx'
import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'

import { InputEventOption } from '@tremolo-ui/functions'
import { parseValue, Units } from '@tremolo-ui/functions/NumberInput'

import { NumberInputProvider, useDispatch, useStore } from './context'

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
  children,
  ...props
}: Omit<NumberInputProps, 'value'> &
  Omit<ComponentPropsWithoutRef<'input'>, keyof NumberInputProps | 'type'>) {
  const [editing, setEditing] = useState(false)
  const { value } = useStore()
  const dispatch = useDispatch()
  const handleChange = useCallback(
    (text: string) => {
      dispatch({
        type: 'change',
        value: text,
      })
    },
    [dispatch],
  )

  const error = useMemo(() => {
    if (editing) return false
    const v = parseValue(value, units, digit).rawValue
    return (
      (min ?? Number.MIN_SAFE_INTEGER) > v ||
      v > (max ?? Number.MAX_SAFE_INTEGER)
    )
  }, [editing, digit, max, min, units, value])

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
        console.log(v)
        handleChange(v)
        onChange?.(Number(v), event)
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
        onFocus?.(parsed.rawValue, event)
      }}
      onBlur={(event) => {
        setEditing(false)
        // update value
        const v = event.currentTarget.value
        const parsed = parseValue(v, units, digit)
        handleChange(parsed.formatValue)
        onBlur?.(parsed.rawValue, event)
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
      value={value}
      min={min}
      max={max}
      step={step}
      units={units}
      digit={digit}
      keepWithinRange={keepWithinRange}
    >
      <div
        className={clsx('tremolo-number-input-wrapper', wrapperClassName)}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        data-stepper={!!children}
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
