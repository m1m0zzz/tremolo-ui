import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  type ChangeSource,
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
  commitNumberInputText,
  InputEventOption,
  ModifierState,
  type ModifierValue,
  numberInputBounds,
  numberInputRanges,
  nudgeNumberInput,
  parseNumberText,
  wheelDirection,
} from '@tremolo-ui/dom'
import { linearScale, type Scale } from '@tremolo-ui/functions'

import { useComposedRefs } from '../../compose-refs'
import { useChangeGesture } from '../../hooks/_internal/useChangeGesture'
import { useCheckSteps } from '../../hooks/_internal/useCheckSteps'
import { useWheel } from '../../hooks/useWheel'

import { NumberInputGestureProvider, NumberInputProvider } from './context'
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

  /**
   * Lowest value. Leave it out for no lower bound.
   *
   * It is enforced when a value is committed or stepped, while `clampValue` is
   * on. A value below it carries `data-out-of-range` on `InputField`.
   */
  min?: number
  /**
   * Highest value. Leave it out for no upper bound.
   *
   * It is enforced when a value is committed or stepped, while `clampValue` is
   * on. A value above it carries `data-out-of-range` on `InputField`.
   */
  max?: number
  /**
   * Granularity of the value. The steppers, a drag on `Stepper`, the wheel and
   * the arrow keys snap it to multiples of `step`; a typed value is left as it
   * is.
   *
   * @default 1
   */
  step?: number
  /**
   * How the value is distributed across the travel of a drag or a
   * `'normalized'` wheel / keyboard nudge.
   *
   * @default linearScale
   */
  scale?: Scale

  /**
   * Render the value as text. Plain digits by default.
   *
   * `unitFormat` from `@tremolo-ui/functions` builds this and `parse` together
   * for a unit, as a pair to spread into the root.
   *
   * @example
   * <NumberInput.Root {...unitFormat('Hz', { digits: 2 })} value={v} />
   */
  format?: (value: number) => string
  /**
   * Read a value back out of the text. Has to undo `format`.
   *
   * Text with no number in it reads as `NaN`, which leaves the value alone.
   * The default, `parseNumberText` from `@tremolo-ui/dom`, reads the number
   * with the unit around it left out, and is `NaN` for one it cannot read
   * whole: `1,000`, `1:30`, or a number with a unit in front, such as `L 30`.
   */
  parse?: (text: string) => number

  /**
   * Keep the value within `min` and `max` when it is committed or stepped.
   * Typing is never clamped, so that a value can be entered digit by digit.
   * @default true
   */
  clampValue?: boolean

  /**
   * How much one notch of the wheel moves the value. It only acts while the
   * focus is inside, so that scrolling the page past the input leaves it
   * alone.
   *
   * `['raw', n]` moves the value by `n`, and `['normalized', n]` by `n` of the
   * range between `min` and `max`. The result is snapped to `step`, except for
   * an amount set on a modifier key (`{ default: …, shift: … }`). `null` turns
   * the wheel off.
   *
   * @default ['raw', 1]
   */
  wheel?: ModifierValue<InputEventOption> | null
  /**
   * How much one arrow key press moves the value.
   *
   * `['raw', n]` moves the value by `n`, and `['normalized', n]` by `n` of the
   * range between `min` and `max`. The result is snapped to `step`, except for
   * an amount set on a modifier key, which is what lets shift move off the
   * grid. `null` turns the arrow keys off.
   *
   * The default moves by 1, and by 0.1 with shift. With a `step` above 1, raise
   * the amount to match: 1 would round straight back to where it started, and
   * a development build warns about it.
   *
   * @default { default: ['raw', 1], shift: ['raw', 0.1] }
   */
  keyboard?: ModifierValue<InputEventOption> | null
  /**
   * Pixels of vertical drag on `Stepper` that move the value by one `step`.
   * `null` turns the drag off.
   * @default 1
   */
  drag?: number | null

  /**
   * How much a `Stepper` drag counts, per modifier key.
   *
   * `1` is `drag` pixels per `step`; `0.1` makes the same movement cover a
   * tenth of that. Shift is bound to `0.1` by default, to match what it does
   * on the arrow keys.
   *
   * A modifier entry is not snapped to `step`, which is what lets a finer
   * amount move at all.
   *
   * @default { default: 1, shift: 0.1 }
   */
  dragSensitivity?: ModifierValue<number>

  /**
   * Hide the cursor while dragging a `Stepper` and read the pointer movement
   * directly, rather than letting it wander off across the screen.
   *
   * The drag is already relative, so the pointer position carries nothing —
   * but it still runs into the edge of the screen, where the operating system
   * pins it and the coordinates stop changing.
   *
   * Off by default: the browser shows its own notice, Esc takes the lock back,
   * and the request can be refused. A refused request is not an error, and the
   * drag carries on as an ordinary one.
   *
   * @default false
   */
  pointerLock?: boolean
  /**
   * The cursor to show while dragging a `Stepper`. It is set on the stepper
   * being dragged, so it stays while the pointer is outside it.
   *
   * @default 'ns-resize'
   */
  dragCursor?: CSSProperties['cursor']

  /**
   * Select the text when `InputField` takes focus: `'all'` selects all of it,
   * `'number'` only the number, leaving the unit the format put around it,
   * and `'none'` leaves the caret where the click put it.
   * @default 'none'
   */
  selectOnFocus?: 'all' | 'number' | 'none'
  /**
   * Show the plain value while `InputField` has focus, dropping whatever
   * `format` put around it: an input reading `1.23kHz` shows `1230` to be
   * typed over.
   *
   * The number shown is the value itself, not the number inside the formatted
   * text. Those differ whenever the format scales — `1.23` out of `1.23kHz`
   * would read back as 1.23 and lose a factor of a thousand — and it is also
   * why a rounded display no longer becomes the value: `1.6` shown as `2Hz`
   * offers `1.6` for editing, not `2`.
   *
   * @default false
   */
  unformatOnFocus?: boolean
  /**
   * Put the caret in `InputField` back where it was after an arrow key steps
   * the value.
   *
   * A controlled input whose `value` is replaced drops the caret at the end,
   * so without this the second press of a repeated step always acts on the
   * last digit. With it, the digit under the caret stays under the caret and
   * a column can be held while stepping.
   *
   * The position is measured from the decimal point rather than from either
   * end, so it survives the number growing or shrinking: the caret between
   * `9` and `.9` is still between `10` and `.0`.
   *
   * It only restores the caret. Which digit it sits on does not change the
   * size of the step — that is `keyboard`'s to say.
   *
   * @default false
   */
  keepCaretOnStep?: boolean
  /**
   * Commit and leave `InputField` when Enter is pressed. Enter commits either
   * way.
   * @default true
   */
  blurOnEnter?: boolean

  /**
   * Make the input unchangeable and remove it from the tab order.
   * The parts carry `data-disabled` while it is set.
   */
  disabled?: boolean
  /**
   * Make the value unchangeable.
   * The parts carry `data-readonly` while it is set.
   */
  readOnly?: boolean

  /**
   * Called with the new value. While the user types, it is called for every
   * entry that reads as a number, unclamped; committing the entry calls it
   * again if clamping changes the value.
   */
  onChange?: (value: number) => void
  /**
   * Called when a change of the value starts — a press on a stepper, the
   * first wheel notch, arrow key or typed character — with the value before
   * it and what it is made with. A host recording automation can treat the
   * input as touched from here until `onChangeEnd`.
   */
  onChangeStart?: (value: number, source: ChangeSource) => void
  /**
   * Called when the change ends, with the value it ended on: when the stepper
   * is released, when typed text is committed, or `changeEndDelay` after the
   * last wheel notch or arrow key.
   */
  onChangeEnd?: (value: number, source: ChangeSource) => void
  /**
   * How long after the last wheel notch, arrow key or typed character the
   * change counts as over, in milliseconds. None of them has an event that
   * says it is done.
   *
   * @default 500
   */
  changeEndDelay?: number

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

  /**
   * Receives `focus` and `blur`, which act on the input of `InputField` — the
   * element that takes the focus — and do nothing while
   * the input is disabled. `ref` reaches the root element itself.
   */
  actionsRef?: Ref<NumberInputMethods>
}

export interface NumberInputMethods {
  focus: () => void
  blur: () => void
}

const defaultFormat = (value: number) => String(value)

type Props = NumberInputProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof NumberInputProps>

export const Root = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  (
    {
      value,
      min,
      max,
      step = 1,
      scale = linearScale,
      format: formatProp,
      parse: parseProp,
      clampValue = true,
      wheel = DEFAULT_WHEEL_OPTIONS,
      keyboard = DEFAULT_KEYBOARD_OPTIONS,
      drag = 1,
      dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
      pointerLock = false,
      dragCursor = 'ns-resize',
      selectOnFocus = 'none',
      unformatOnFocus = false,
      keepCaretOnStep = false,
      blurOnEnter = true,
      disabled = false,
      readOnly = false,
      className,
      style,
      onChange,
      onChangeStart,
      onChangeEnd,
      changeEndDelay,
      children,
      actionsRef,
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
    const inactive = disabled || readOnly

    const gesture = useChangeGesture(
      value,
      { onChangeStart, onChangeEnd, changeEndDelay },
      inactive,
    )

    // --- interpret props ---
    const format = formatProp ?? defaultFormat
    const parse = parseProp ?? parseNumberText

    const { normalized: range, raw: rawRange } = useMemo(
      () => numberInputRanges({ min, max, step, scale, clampValue }),
      [clampValue, min, max, step, scale],
    )
    const ranges = useMemo(
      () => ({ normalized: range, raw: rawRange }),
      [range, rawRange],
    )

    // The pipeline range stands in the safe-integer range when an end is
    // open, and there is no travel to sample across that. Probing is skipped
    // rather than run against a range nobody set.
    const probeRange = useMemo(
      () =>
        min !== undefined && max !== undefined && min < max
          ? { min, max, step, scale }
          : null,
      [min, max, step, scale],
    )

    useCheckSteps({
      component: 'NumberInput',
      range: probeRange,
      keyboard,
      wheel,
      format,
    })

    const text = draft ?? format(value)
    const editing = draft !== null
    const bounds = numberInputBounds(value, { min, max, clampValue })
    const { atMin, atMax } = bounds
    const outOfRange = !editing && bounds.outOfRange

    // --- internal functions ---
    const handleDraft = useCallback(
      (next: string) => {
        if (inactive) return
        setDraft(next)
        // Deliberately unclamped: clamping here would make "1500" impossible
        // to type into an input whose max is 100.
        const parsed = parse(next)
        if (!Number.isFinite(parsed)) return
        if (parsed !== value) {
          gesture.pulse('keyboard')
          gesture.changed(parsed)
        }
        onChange?.(parsed)
      },
      [inactive, parse, onChange, value, gesture],
    )

    const changeValue = useCallback(
      (next: number) => {
        if (inactive) return
        setDraft(null)
        if (next === value) return
        gesture.changed(next)
        onChange?.(next)
      },
      [inactive, value, onChange, gesture],
    )

    const commitDraft = useCallback(() => {
      if (draft === null || inactive) return
      const committed = commitNumberInputText(draft, parse, {
        min,
        max,
        clampValue,
      })
      // Text with no number in it is not a value. Dropping the draft puts the
      // input back to what it was showing.
      if (committed === null) {
        setDraft(null)
        return
      }
      // The typing was a gesture of its own, and committing is where it ends.
      if (committed !== value) gesture.pulse('keyboard')
      changeValue(committed)
      gesture.end()
    }, [
      draft,
      inactive,
      parse,
      clampValue,
      min,
      max,
      changeValue,
      value,
      gesture,
    ])

    const nudge = useCallback(
      (
        direction: number,
        option: ModifierValue<InputEventOption>,
        modifiers?: ModifierState,
      ) => {
        changeValue(
          nudgeNumberInput(value, direction, option, ranges, modifiers),
        )
      },
      [changeValue, value, ranges],
    )

    // --- hooks ---
    const wheelRefCallback = useWheel<HTMLDivElement>(
      (event) => {
        const direction = wheelDirection(event)
        if (!wheel || inactive || direction === null) return
        event.preventDefault()
        gesture.pulse('wheel')
        nudge(direction, wheel, event)
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
        readOnly,
        clampValue,
        range,
        rawRange,
        keyboard,
        text,
        editing,
        outOfRange,
        dragSensitivity,
        pointerLock,
        dragCursor,
        selectOnFocus,
        unformatOnFocus,
        keepCaretOnStep,
        blurOnEnter,
        atMin,
        atMax,
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
        readOnly,
        clampValue,
        range,
        rawRange,
        keyboard,
        text,
        editing,
        outOfRange,
        atMin,
        atMax,
        drag,
        dragSensitivity,
        pointerLock,
        dragCursor,
        selectOnFocus,
        unformatOnFocus,
        keepCaretOnStep,
        blurOnEnter,
        format,
        parse,
        handleDraft,
        commitDraft,
        changeValue,
        nudge,
      ],
    )

    // Composed once, so React attaches the refs a single time instead of
    // detaching and re-attaching on every render.
    const rootRefCallback = useComposedRefs<HTMLDivElement>(
      forwardedRef,
      wheelRefCallback,
    )

    useImperativeHandle(actionsRef, () => {
      return {
        focus() {
          if (!disabled) inputRef.current?.focus()
        },
        blur() {
          inputRef.current?.blur()
        },
      }
    }, [disabled])

    const pressed = useRef(false)
    const gestureContext = useMemo(
      () => ({
        press: () => {
          if (inactive) return
          gesture.hold('pointer')
          // A press on a stepper reaches `Stepper` too; one release will do.
          if (pressed.current) return
          pressed.current = true
          // Released wherever the pointer ends up: the stepper drag captures
          // it, and a press that wanders off the button still ends.
          const release = () => {
            pressed.current = false
            gesture.end()
            window.removeEventListener('pointerup', release)
            window.removeEventListener('pointercancel', release)
          }
          window.addEventListener('pointerup', release)
          window.addEventListener('pointercancel', release)
        },
        key: () => {
          if (!inactive) gesture.pulse('keyboard')
        },
      }),
      [gesture, inactive],
    )

    return (
      <NumberInputProvider value={context}>
        <NumberInputGestureProvider value={gestureContext}>
          <div
            ref={rootRefCallback}
            className={className}
            data-disabled={disabled ? '' : undefined}
            data-readonly={readOnly ? '' : undefined}
            style={style}
            {...props}
          >
            {children}
          </div>
        </NumberInputGestureProvider>
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

export { useNumberInputContext, type NumberInputContextValue } from './context'
