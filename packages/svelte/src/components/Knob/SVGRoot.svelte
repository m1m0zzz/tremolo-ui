<script lang="ts">
  import { KNOB_VIEWBOX_SIZE } from '@tremolo-ui/dom'

  import { setPlacement } from '../_util/placement.js'

  import type { Snippet } from 'svelte'
  import type { SVGAttributes } from 'svelte/elements'

  type Props = SVGAttributes<SVGSVGElement> & {
    /**
     * `Knob.InactiveLine`, `Knob.ActiveLine` and `Knob.Thumb` go here, in the
     * order you want them painted.
     */
    children: Snippet
  }

  let { children, style, ...rest }: Props = $props()

  setPlacement('Knob.SVGRoot')
</script>

<svg
  viewBox="0 0 {KNOB_VIEWBOX_SIZE} {KNOB_VIEWBOX_SIZE}"
  style="display: block; {style ?? ''}"
  {...rest}
>
  {@render children()}
</svg>
