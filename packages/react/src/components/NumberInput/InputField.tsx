import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, Ref } from 'react'

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
    outOfRange,
    setDraft,
    commitDraft,
    nudge,
    inputRef,
  } = useNumberInputContext()

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
      value={text}
      readOnly={readonly}
      aria-disabled={disabled}
      aria-readonly={readonly}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={text}
      step={step}
      data-out-of-range={outOfRange}
      style={style}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onFocus={(event) => {
        const input = event.currentTarget
        if (selectOnFocus === 'all') {
          input.setSelectionRange(0, input.value.length)
        } else if (selectOnFocus === 'number') {
          input.setSelectionRange(
            0,
            input.value.match(NUMBER_PREFIX)?.[0].length ?? 0,
          )
        }
        onFocus?.(event)
      }}
      onBlur={(event) => {
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
          nudge(key === 'ArrowUp' ? 1 : -1, keyboard)
        }
        onKeyDown?.(event)
      }}
      {...props}
    />
  )
}
