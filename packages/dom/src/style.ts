/**
 * A number as a CSS length, for a custom property.
 *
 * A custom property takes whatever text it is given, so `--size: 50` comes out
 * as the invalid `50` rather than `50px`. React appends `px` to a bare number
 * only for the properties it knows take a length, and a custom property is
 * never one of them; Vue and Svelte append nothing at all. Anything already a
 * string is passed through, so `'3rem'` and `'100%'` still work.
 */
export function cssLength(
  value: number | string | undefined,
): string | undefined {
  return typeof value === 'number' ? `${value}px` : value
}

/**
 * Take an element out of sight while leaving it in the accessibility tree and
 * in the tab order.
 *
 * `display: none` and `visibility: hidden` would remove it from both, and the
 * native control underneath a headless component is what carries the ARIA and
 * the keyboard behaviour. `pointer-events: none` is safe because nothing is
 * ever clicked here directly: a `<label>` forwards its click, and a drag is
 * handled by the part that is visible.
 *
 * Every value is a string with its unit, so the object can be handed to any
 * framework's `style` binding as it is.
 */
export const visuallyHiddenStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: '0',
  pointerEvents: 'none',
} as const
