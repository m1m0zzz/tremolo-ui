/**
 * Reading a number out of the text of a number input, and keeping the caret
 * in place while the number under it changes.
 *
 * The text is whatever `format` made of the value — `"440 Hz"`, `"-6.0 dB"` —
 * or a half-typed entry, so none of this assumes the text is a number alone.
 */

/**
 * A number at the start of the text, and nothing read after it. A half-typed
 * entry still yields the number in front of it, but text with no number is
 * `NaN` rather than 0, so that "unreadable" and "the user typed 0" stay apart.
 */
const LEADING_NUMBER = /^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/

/**
 * The number the text starts with, or `NaN` when it does not start with one.
 * The default `parse` of a number input.
 */
export function parseLeadingNumber(text: string): number {
  const match = text.match(LEADING_NUMBER)
  return match ? Number(match[1]) : NaN
}

/** The leading number of the displayed text, whatever the format put around it. */
const NUMBER_PREFIX = /^\s*-?[\d.,]*/

/**
 * How many characters the number at the start of the text takes up, with any
 * whitespace before it: the part to select when only the number should be.
 */
export function leadingNumberLength(text: string): number {
  return text.match(NUMBER_PREFIX)?.[0].length ?? 0
}

/**
 * The index the caret is measured against: the decimal point, or where one
 * would go if the number has none.
 *
 * Measuring from an end instead would slide the caret across a digit whenever
 * the number changed length — `9.9` to `10.0` gains a character in front, `10`
 * to `9` loses one — which is exactly what stepping does.
 */
function decimalAnchor(text: string) {
  const dot = text.indexOf('.')
  return dot === -1 ? leadingNumberLength(text) : dot
}

/**
 * Where the caret is, relative to the decimal point, so that it can be put
 * back at the same digit once the value has changed. See
 * {@link caretAtDecimalOffset}.
 */
export function caretDecimalOffset(text: string, caret: number): number {
  return caret - decimalAnchor(text)
}

/**
 * The caret position `offset` characters from the decimal point of the new
 * text, kept within the number.
 *
 * @example
 * // The caret sits in front of the point of "9.9" when ArrowUp turns it
 * // into "10.0"
 * const offset = caretDecimalOffset('9.9', 1) // 0
 * caretAtDecimalOffset('10.0', offset) // 2: still in front of the point
 */
export function caretAtDecimalOffset(text: string, offset: number): number {
  const place = decimalAnchor(text) + offset
  return Math.max(0, Math.min(place, leadingNumberLength(text)))
}
