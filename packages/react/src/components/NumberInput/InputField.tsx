import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  Ref,
  useEffect,
  useState,
} from 'react'

import { useComposedRefs } from '../_util/composeRefs'

import { useNumberInputContext } from './context'

export interface NumberInputFieldProps {
  /**
   * Select the text when the input takes focus. `'number'` selects the leading
   * number, leaving whatever the format appended to it.
   * @default 'none'
   */
  selectOnFocus?: 'all' | 'number' | 'none'
  /**
   * Show the plain value while the input has focus, dropping whatever `format`
   * put around it: an input reading `1.23kHz` shows `1230` to be typed over.
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
   * Commit and leave the input when Enter is pressed. Enter commits either way.
   * @default true
   */
  blurOnEnter?: boolean

  className?: string
  style?: CSSProperties
  ref?: Ref<HTMLInputElement>
}

/** The leading number of the displayed text, whatever the format put around it. */
const NUMBER_PREFIX = /^\s*-?[\d.,]*/

/**
 * The text field of a `NumberInput`, and the only place the value can be typed.
 *
 * While the user types, their own text stands rather than `format(value)`, so
 * that a half-finished entry is not rewritten under the caret.
 */
export function InputField({
  selectOnFocus = 'none',
  unformatOnFocus = false,
  blurOnEnter = true,
  className,
  style,
  ref,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: NumberInputFieldProps &
  Omit<
    ComponentPropsWithoutRef<'input'>,
    keyof NumberInputFieldProps | 'type' | 'value' | 'defaultValue'
  >) {
  const {
    value,
    min,
    max,
    step,
    disabled,
    readonly,
    keyboard,
    text,
    editing,
    outOfRange,
    setDraft,
    commitDraft,
    nudge,
    inputRef,
  } = useNumberInputContext()

  const [focused, setFocused] = useState(false)

  // Only until the first keystroke: from then on the draft is the user's own
  // text and stands on its own, formatted or not.
  const shown = unformatOnFocus && focused && !editing ? String(value) : text

  // Selecting has to wait for that swap. Called from the focus handler it
  // would run against the formatted text still in the input and cover the
  // wrong characters.
  useEffect(() => {
    if (!focused || selectOnFocus === 'none') return
    const input = inputRef.current
    if (!input) return
    if (selectOnFocus === 'all') {
      input.setSelectionRange(0, input.value.length)
    } else {
      input.setSelectionRange(
        0,
        input.value.match(NUMBER_PREFIX)?.[0].length ?? 0,
      )
    }
    // Deliberately not re-run as the text changes: that would drag the
    // selection back over what the user is typing.
  }, [focused, selectOnFocus, inputRef])

  const composedRef = useComposedRefs<HTMLInputElement>(ref, inputRef)

  return (
    <input
      ref={composedRef}
      className={clsx('tremolo-number-input-field', className)}
      // Not type="number": that brings native spinners and a value the browser
      // parses itself, neither of which survives a unit suffix.
      type="text"
      inputMode="decimal"
      role="spinbutton"
      value={shown}
      readOnly={readonly}
      aria-disabled={disabled}
      aria-readonly={readonly}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      // The formatted text, even while the field shows the plain number: it is
      // the one that says what the value means.
      aria-valuetext={text}
      step={step}
      data-out-of-range={outOfRange}
      style={style}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onFocus={(event) => {
        setFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setFocused(false)
        // Nothing was typed, so there is no draft and this returns at once —
        // taking focus and leaving again never commits anything.
        commitDraft()
        onBlur?.(event)
      }}
      onKeyDown={(event) => {
        const key = event.key
        if (key === 'Enter') {
          commitDraft()
          if (blurOnEnter) event.currentTarget.blur()
        } else if (
          keyboard &&
          !readonly &&
          (key === 'ArrowUp' || key === 'ArrowDown')
        ) {
          event.preventDefault()
          nudge(key === 'ArrowUp' ? 1 : -1, keyboard, event)
        }
        onKeyDown?.(event)
      }}
      {...props}
    />
  )
}
