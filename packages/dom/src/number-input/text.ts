/**
 * Reading a number out of the text of a number input, and keeping the caret
 * in place while the number under it changes.
 *
 * The text is whatever `format` made of the value — `"440 Hz"`, `"-6.0 dB"` —
 * or a half-typed entry, so none of this assumes the text is a number alone.
 */

/** The signs a number can carry. U+2212 is what some `Intl.NumberFormat` locales write. */
const SIGNS = '+-\u2212'

/** Where the number is in the text; the rest, on either side, is the unit. */
export interface NumberSpan {
  start: number
  end: number
}

/**
 * Where the number is in the text: from its first digit to its last, with the
 * sign and the decimal point in front of it. Whatever is left on either side
 * is taken for the unit, so it does not matter whether a space separates them,
 * or what the number looks like — `+6.0`, `1e+21`, `1,000` and `1:30` are each
 * one number. `null` when the text has no digit at all.
 */
export function numberSpan(text: string): NumberSpan | null {
  const first = text.search(/\d/)
  if (first === -1) return null
  let start = first
  if (text[start - 1] === '.') start -= 1
  if (start > 0 && SIGNS.includes(text[start - 1])) start -= 1
  return { start, end: text.search(/\d\D*$/) + 1 }
}

/** A plain number, and nothing else: no grouping, no other separators. */
const PLAIN_NUMBER =
  /^[+\-\u2212]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-\u2212]?\d+)?$/

/**
 * The number in the text, with the unit after it ignored: the default `parse`
 * of a number input.
 *
 * `NaN`, which leaves the value alone, whenever the number cannot be read
 * safely, rather than a part of it: text with no number, a number that is not
 * a plain one (`1,000` would otherwise read as 1, and `1:30` as 1), and text
 * with something in front of the number, which can change what it means (the
 * `L` of a pan reading `L 30`). A `format` that writes any of those needs its
 * own `parse`.
 */
export function parseNumberText(text: string): number {
  const span = numberSpan(text)
  if (!span || text.slice(0, span.start).trim() !== '') return NaN
  const number = text.slice(span.start, span.end)
  return PLAIN_NUMBER.test(number)
    ? Number(number.replace(/\u2212/g, '-'))
    : NaN
}

/**
 * The index the caret is measured against: the decimal point, or where one
 * would go if the number has none — in front of an exponent, if there is one.
 *
 * Measuring from an end instead would slide the caret across a digit whenever
 * the number changed length — `9.9` to `10.0` gains a character in front, `10`
 * to `9` loses one, and so does `9e+9` to `1e+10` behind — which is exactly
 * what stepping does.
 */
function decimalAnchor(text: string, span: NumberSpan) {
  const number = text.slice(span.start, span.end)
  const exponent = number.search(/[eE][+\-\u2212]?\d/)
  const mantissa = exponent === -1 ? number : number.slice(0, exponent)
  const dot = mantissa.indexOf('.')
  return span.start + (dot === -1 ? mantissa.length : dot)
}

const NO_NUMBER: NumberSpan = { start: 0, end: 0 }

/**
 * Where the caret is, relative to the decimal point, so that it can be put
 * back at the same digit once the value has changed. See
 * {@link caretAtDecimalOffset}.
 */
export function caretDecimalOffset(text: string, caret: number): number {
  return caret - decimalAnchor(text, numberSpan(text) ?? NO_NUMBER)
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
  const span = numberSpan(text) ?? NO_NUMBER
  const place = decimalAnchor(text, span) + offset
  return Math.max(span.start, Math.min(place, span.end))
}
