import type { CSSProperties } from 'react'

/**
 * Take an element out of sight while leaving it in the accessibility tree and
 * in the tab order.
 *
 * `display: none` and `visibility: hidden` would remove it from both, and the
 * native control underneath a headless component is what carries the ARIA and
 * the keyboard behaviour. `pointer-events: none` is safe because nothing is
 * ever clicked here directly: a `<label>` forwards its click, and a drag is
 * handled by the part that is visible.
 */
export const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
  pointerEvents: 'none',
}
