import { h, type VNodeProps } from 'vue'

import { visuallyHiddenStyle } from '@tremolo-ui/dom'

/**
 * The control underneath a headless part: out of sight, but in the
 * accessibility tree and the tab order, carrying the ARIA and the keyboard.
 *
 * A plain element rather than a component, so that a `ref` on it reaches the
 * `<input>` itself.
 */
export function visuallyHiddenRangeInput(
  props: VNodeProps & Record<string, unknown>,
) {
  return h('input', { ...props, type: 'range', style: visuallyHiddenStyle })
}
