/**
 * A number as a CSS length, for a custom property.
 *
 * React appends `px` to a bare number for the properties it knows take a
 * length, and a custom property is never one of them: `--size: 50` would come
 * out as the invalid `50`. Anything already a string is passed through, so
 * `'3rem'` and `'100%'` still work.
 */
export function cssLength(
  value: number | string | undefined,
): string | undefined {
  return typeof value === 'number' ? `${value}px` : value
}
