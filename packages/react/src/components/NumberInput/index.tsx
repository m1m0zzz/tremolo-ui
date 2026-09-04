import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  applyDelta,
  clamp,
  formatValue,
  InputEventOption,
  linearScale,
  parseValue,
  type Scale,
  type Units,
  type ValueRange,
} from '@tremolo-ui/functions'

import { useWheel } from '../../hooks/useWheel'

import { NumberInputProvider } from './context'
import { DecrementStepper } from './DecrementStepper'
import { IncrementStepper } from './IncrementStepper'
import { InputField } from './InputField'
import { Stepper } from './Stepper'

export interface NumberInputProps {
  /**
   * The value. What the input shows is `format(value)`, except while the user
   * is typing, when their own text stands until it is committed.
   */
  value: number

  min?: number
  max?: number
  step?: number
  /**
   * How the value is distributed across the travel of a drag or a
   * `'normalized'` wheel / keyboard nudge.
   *
   * @default linearScale
   */
  scale?: Scale

  /**
   * Unit to display the value in, or a list to pick from by magnitude.
   * Builds the default `format` and `parse`.
   *
   * @example
   * units='Hz'
   * units={[['Hz', 1], ['kHz', 1000]]}
   * units={[['ms', 1], ['s', 1000]]}
   */
  units?: string | Units
  /**
   * Digits after the decimal point, for the default `format`.
   *
   * @example
   * // units={[['Hz', 1], ['kHz', 1000]]} digit={2}
   * // 100 -> 100.00Hz, 1600 -> 1.60kHz
   */
  digit?: number
  /** Render the value as text. Takes precedence over `units` / `digit`. */
  format?: (value: number) => string
  /** Read a value back out of the text. Takes precedence over `units`. */
  parse?: (text: string) => number

  /**
   * Keep the value within `min` and `max` when it is committed or stepped.
   * Typing is never clamped, so that a value can be entered digit by digit.
   * @default true
   */
  clampValue?: boolean

  /**
   * Wheel control option. Only applies while the focus is inside, so that
   * scrolling past the input does not change it.
   * If null, no event will be triggered
   */
  wheel?: InputEventOption | null
  /**
   * keyboard control option
   * If null, no event will be triggered
   */
  keyboard?: InputEventOption | null
  /**
   * Pixels of vertical drag on `Stepper` that move the value by one `step`.
   * If null, no event will be triggered
   * @default 1
   */
  drag?: number | null

  /**
   * Only the appearance will change.
   * Please consider using with readonly.
   * aria-disabled property is also applied.
   */
  disabled?: boolean
  /**
   * Make the value unchangeable.
   * aria-readonly property is also applied.
   */
  readonly?: boolean

  className?: string
  style?: CSSProperties
  onChange?: (value: number) => void

  /**
   * The input renders exactly what you compose here; there is no default
   * markup to fall back to.
   *
   * @example
   * <NumberInput.Root value={value} min={0} max={100} onChange={setValue}>
   *   <NumberInput.InputField />
   *   <NumberInput.Stepper>
   *     <NumberInput.IncrementStepper />
   *     <NumberInput.DecrementStepper />
   *   </NumberInput.Stepper>
   * </NumberInput.Root>
   */
  children: ReactNode
}

export interface NumberInputMethods {
  focus: () => void
  blur: () => void
}

type Props = NumberInputProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof NumberInputProps>

export const Root = forwardRef<NumberInputMethods, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      scale = linearScale,
      units,
      digit,
      format: formatProp,
      parse: parseProp,
      clampValue = true,
      wheel = ['raw', 1],
      keyboard = ['raw', 1],
      drag = 1,
      disabled = false,
      readonly = false,
      className,
      style,
      onChange,
      children,
      ...props
    }: Props,
    forwardedRef,
  ) => {
    // --- state and ref ---
    const inputRef = useRef<HTMLInputElement>(null)
    /**
     * The text being typed. The only state here: it is not a copy of `value`,
     * but the half-finished entry that has no value to be derived from yet.
     */
    const [draft, setDraft] = useState<string | null>(null)

    // --- interpret props ---
    const format = useCallback(
      (v: number) =>
        formatProp ? formatProp(v) : formatValue(v, units, digit),
      [formatProp, units, digit],
    )
    const parse = useCallback(
      (t: string) => (parseProp ? parseProp(t) : parseValue(t, units)),
      [parseProp, units],
    )

    // An unbounded end, and a range the caller opted out of enforcing, both
    // become the widest range the value pipeline can express.
    const range: ValueRange = useMemo(
      () => ({
        min: (clampValue ? min : undefined) ?? Number.MIN_SAFE_INTEGER,
        max: (clampValue ? max : undefined) ?? Number.MAX_SAFE_INTEGER,
        step,
        scale,
      }),
      [clampValue, min, max, step, scale],
    )

    const text = draft ?? format(value)
    const editing = draft != null
    const outOfRange =
      !editing &&
      ((min != undefined && value < min) || (max != undefined && value > max))

    // --- internal functions ---
    const handleDraft = useCallback(
      (next: string) => {
        if (readonly) return
        setDraft(next)
        // Deliberately unclamped: clamping here would make "1500" impossible
        // to type into an input whose max is 100.
        const parsed = parse(next)
        if (Number.isFinite(parsed)) onChange?.(parsed)
      },
      [readonly, parse, onChange],
    )

    const changeValue = useCallback(
      (next: number) => {
        if (readonly) return
        setDraft(null)
        if (next != value) onChange?.(next)
      },
      [readonly, value, onChange],
    )

    const commitDraft = useCallback(() => {
      if (draft == null || readonly) return
      // `range` is already the widest possible range when clampValue is off.
      changeValue(clamp(parse(draft), range.min, range.max))
    }, [draft, readonly, parse, range, changeValue])

    const nudge = useCallback(
      (direction: number, option: InputEventOption) => {
        changeValue(applyDelta(value, direction, option, range))
      },
      [changeValue, value, range],
    )

    // --- hooks ---
    const wheelRefCallback = useWheel<HTMLDivElement>(
      (event) => {
        if (!wheel || readonly || event.deltaY == 0) return
        event.preventDefault()
        nudge(-Math.sign(event.deltaY), wheel)
      },
      { requireFocus: true },
    )

    const context = useMemo(
      () => ({
        value,
        min,
        max,
        step,
        scale,
        disabled,
        readonly,
        clampValue,
        range,
        keyboard,
        text,
        editing,
        outOfRange,
        atMin: clampValue && min != undefined && value <= min,
        atMax: clampValue && max != undefined && value >= max,
        drag,
        format,
        parse,
        setDraft: handleDraft,
        commitDraft,
        changeValue,
        nudge,
        inputRef,
      }),
      [
        value,
        min,
        max,
        step,
        scale,
        disabled,
        readonly,
        clampValue,
        range,
        keyboard,
        text,
        editing,
        outOfRange,
        drag,
        format,
        parse,
        handleDraft,
        commitDraft,
        changeValue,
        nudge,
      ],
    )

    useImperativeHandle(forwardedRef, () => {
      return {
        focus() {
          inputRef.current?.focus()
        },
        blur() {
          inputRef.current?.blur()
        },
      }
    }, [])

    return (
      <NumberInputProvider value={context}>
        <div
          ref={wheelRefCallback}
          className={clsx('tremolo-number-input', className)}
          aria-disabled={disabled}
          aria-readonly={readonly}
          style={style}
          {...props}
        >
          {children}
        </div>
      </NumberInputProvider>
    )
  },
)

/**
 * Input with some useful functions for entering numerical values.
 */
export const NumberInput = {
  Root,
  InputField,
  Stepper,
  IncrementStepper,
  DecrementStepper,
}

export { useNumberInputContext } from './context'
export { type NumberInputFieldProps } from './InputField'
export { type StepperProps } from './Stepper'
export { type IncrementStepperProps } from './IncrementStepper'
export { type DecrementStepperProps } from './DecrementStepper'
