import {
  ComponentPropsWithoutRef,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useComposedRefs } from '../../compose-refs'
import { type WithCSSVariables } from '../../css-variables'

import { useNumberInputContext } from './context'

// The value belongs to `NumberInput.Root`, and the field is always text.
type Props = WithCSSVariables<
  Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'defaultValue'>
>

/** The leading number of the displayed text, whatever the format put around it. */
const NUMBER_PREFIX = /^\s*-?[\d.,]*/

const numberEnd = (text: string) =>
  text.match(NUMBER_PREFIX)?.[0].length ?? text.length

/**
 * The index the caret is measured against: the decimal point, or where one
 * would go if the number has none.
 *
 * Measuring from an end instead would slide the caret across a digit whenever
 * the number changed length — `9.9` to `10.0` gains a character in front, `10`
 * to `9` loses one — which is exactly what stepping does.
 */
const decimalAnchor = (text: string) => {
  const dot = text.indexOf('.')
  return dot === -1 ? numberEnd(text) : dot
}

/**
 * The text field of a `NumberInput`, and the only place the value can be typed.
 *
 * While the user types, their own text stands rather than `format(value)`, so
 * that a half-finished entry is not rewritten under the caret.
 *
 * How it behaves on focus, Enter and the arrow keys is set on `Root`
 * (`selectOnFocus`, `unformatOnFocus`, `keepCaretOnStep`, `blurOnEnter`).
 */
export const InputField = /* @__PURE__ */ forwardRef<HTMLInputElement, Props>(
  function InputField(
    { className, style, onFocus, onBlur, onKeyDown, ...props },
    forwardedRef,
  ) {
    const {
      value,
      min,
      max,
      step,
      disabled,
      readonly,
      keyboard,
      selectOnFocus,
      unformatOnFocus,
      keepCaretOnStep,
      blurOnEnter,
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

    /**
     * Where to put the caret once the stepped value has been rendered, and the
     * text it was measured against.
     */
    const caretAfterStep = useRef<{ offset: number; from: string } | null>(null)

    // A layout effect rather than a plain one: the caret is moved before the
    // browser paints, so it is never seen at the end of the text first.
    useLayoutEffect(() => {
      const pending = caretAfterStep.current
      if (!pending) return
      caretAfterStep.current = null

      const input = inputRef.current
      // The step may have been clamped away, leaving the text as it was. The
      // caret has not moved either, since the key press was prevented.
      if (!input || input.value === pending.from) return

      const place = decimalAnchor(input.value) + pending.offset
      const caret = Math.max(0, Math.min(place, numberEnd(input.value)))
      input.setSelectionRange(caret, caret)
    })

    const composedRef = useComposedRefs<HTMLInputElement>(
      forwardedRef,
      inputRef,
    )

    return (
      <input
        ref={composedRef}
        className={className}
        // Not type="number": that brings native spinners and a value the browser
        // parses itself, neither of which survives a unit suffix.
        type="text"
        inputMode="decimal"
        role="spinbutton"
        value={shown}
        disabled={disabled}
        readOnly={readonly}
        aria-disabled={disabled}
        aria-readonly={readonly}
        data-disabled={disabled ? '' : undefined}
        data-readonly={readonly ? '' : undefined}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        // The formatted text, even while the field shows the plain number: it is
        // the one that says what the value means.
        aria-valuetext={text}
        step={step}
        data-out-of-range={outOfRange ? '' : undefined}
        style={style}
        onChange={(event) => {
          // The text is the user's own now, so a caret measured against the
          // stepped one no longer means anything.
          caretAfterStep.current = null
          setDraft(event.currentTarget.value)
        }}
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
            !disabled &&
            !readonly &&
            (key === 'ArrowUp' || key === 'ArrowDown') &&
            // Arrow keys pick a candidate while an IME is converting. Stepping
            // the value there would fight the conversion, and moving the caret
            // would break it outright.
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault()
            const input = event.currentTarget
            if (keepCaretOnStep && input.selectionStart !== null) {
              caretAfterStep.current = {
                offset: input.selectionStart - decimalAnchor(input.value),
                from: input.value,
              }
            }
            nudge(key === 'ArrowUp' ? 1 : -1, keyboard, event)
          }
          onKeyDown?.(event)
        }}
        {...props}
      />
    )
  },
)
