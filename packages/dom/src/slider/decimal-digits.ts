/**
 * How many digits a number carries after the decimal point.
 *
 * `Slider.Marks` builds its labels by multiplying an interval, which leaves
 * binary debris in the last digits (`0.1 * 3` is `0.30000000000000004`). The
 * count is what tells `toFixed` how far to round that back.
 *
 * The exponent form has to be handled separately: `String(1e-7)` is `'1e-7'`,
 * which has no decimal point at all, so reading the text after the point
 * reports no digits and the interval rounds away to whole numbers.
 */
export function decimalDigits(x: number): number {
  if (!Number.isFinite(x)) return 0

  const text = String(x)
  const e = text.indexOf('e')
  if (e === -1) return text.split('.')[1]?.length ?? 0

  const fraction = text.slice(0, e).split('.')[1]?.length ?? 0
  // A negative exponent pushes the point further right, a positive one pulls
  // it back past the digits that are there.
  return Math.max(0, fraction - Number(text.slice(e + 1)))
}
