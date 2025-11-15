import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  clamp,
  InputEventOption,
  normalizeValue,
  rawValue,
  stepValue,
} from '@tremolo-ui/functions'

import { useRefCallbackEvent } from '../../hooks/useRefCallbackEvent'

import { safeClamp, useNumberInputContext } from './context'
import { parseValue } from './type'

import { NumberInputMethods } from '.'

interface InternalProps {
  disabled: boolean
  readonly: boolean
  wheel: InputEventOption | null
  keyboard: InputEventOption | null

  selectWithFocus?: 'all' | 'number' | 'none'
  blurOnEnter?: boolean
  keepWithinRange?: boolean
  clampValueOnBlur?: boolean

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
}

type InternalPropsWithAttributes = InternalProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof InternalProps>

export const InternalInput = forwardRef<
  NumberInputMethods,
  InternalPropsWithAttributes
>(
  (
    {
      disabled,
      readonly,
      selectWithFocus,
      blurOnEnter,
      clampValueOnBlur,
      wheel,
      keyboard,
      className,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      children: _children,
      ...props
    }: InternalPropsWithAttributes,
    ref,
  ) => {
    const elmRef = useRef<HTMLInputElement>(null)
    const [editing, setEditing] = useState(false)
    const value = useNumberInputContext((s) => s.value)
    const valueAsNumber = useNumberInputContext((s) => s.valueAsNumber)
    const min = useNumberInputContext((s) => s.min)
    const max = useNumberInputContext((s) => s.max)
    const step = useNumberInputContext((s) => s.step)
    const units = useNumberInputContext((s) => s.units)
    const digit = useNumberInputContext((s) => s.digit)
    const change = useNumberInputContext((s) => s.change)

    const error = useMemo(() => {
      if (editing) return false
      const v = valueAsNumber
      return (min ?? -Infinity) > v || v > (max ?? Infinity)
    }, [editing, max, min, valueAsNumber])

    const updateValueByEvent = useCallback(
      (eventType: InputEventOption[0], x: number) => {
        let newValue
        if (eventType == 'normalized') {
          if (!min || !max) {
            throw new Error(
              '[NumberInput] "min" and "max" are required when InputEventOption[0] is set to "normalized".',
            )
          }
          const n = normalizeValue(valueAsNumber, min, max)
          newValue = rawValue(n + x, min, max)
          return clamp(stepValue(newValue, step), min, max)
        } else {
          newValue = valueAsNumber + x
          return stepValue(newValue, step)
        }
      },
      [max, min, step, valueAsNumber],
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!keyboard || !onChange || readonly) return
        const key = event.key
        if (!['ArrowUp', 'ArrowDown'].includes(key)) return
        event.preventDefault()
        const x = key == 'ArrowUp' ? keyboard[1] : -keyboard[1]
        const parsed = parseValue(String(updateValueByEvent(keyboard[0], x)))
        // console.log('key control')
        onChange?.(parsed.rawValue, parsed.formatValue)
      },
      [keyboard, readonly, onChange, updateValueByEvent],
    )

    const wheelRefCallback = useRefCallbackEvent(
      'wheel',
      (event) => {
        if (!wheel || readonly) return
        event.preventDefault()
        if (!onChange || event.deltaY == 0) return
        const x = Math.sign(event.deltaY) * -wheel[1]
        const parsed = parseValue(String(updateValueByEvent(wheel[0], x)))
        // console.log('wheel control')
        onChange?.(parsed.rawValue, parsed.formatValue)
      },
      { passive: false },
      [wheel, readonly, onChange, updateValueByEvent],
    )

    useImperativeHandle(ref, () => {
      return {
        focus() {
          elmRef.current?.focus()
        },
        blur() {
          elmRef.current?.blur()
        },
      }
    }, [])

    return (
      <input
        ref={(input) => {
          elmRef.current = input
          wheelRefCallback(input)
        }}
        className={clsx('tremolo-number-input', className)}
        value={value}
        min={min}
        max={max}
        step={step}
        type="text"
        aria-disabled={disabled}
        aria-readonly={readonly}
        tabIndex={-1}
        data-error={error}
        onChange={(event) => {
          if (readonly) return
          const v = event.currentTarget.value
          const cursorPos = event.target.selectionStart
          change(v)
          const valueAsNumber = parseValue(v, units, digit).rawValue
          onChange?.(valueAsNumber, v)
          if (cursorPos) {
            event.target.selectionStart = cursorPos
            event.target.selectionEnd = cursorPos
          }
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
          handleKeyDown(event)
          onKeyDown?.(event)
        }}
        {...props}
      />
    )
  },
)
