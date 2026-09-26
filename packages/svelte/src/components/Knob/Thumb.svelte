<script lang="ts">
  import { KNOB_VIEWBOX_SIZE } from '@tremolo-ui/dom'
  import { clamp } from '@tremolo-ui/functions'

  import { checkPlacement } from '../_util/placement.js'

  import { useKnobContext } from './context.js'
  import type { KnobThumbProps } from './types.js'

  import type { SVGAttributes } from 'svelte/elements'

  type Props = KnobThumbProps &
    Omit<SVGAttributes<SVGSVGElement>, keyof KnobThumbProps>

  let {
    thumb = 'currentColor',
    thumbLine = 'currentColor',
    thumbSize = 84,
    thumbLineWeight = 6,
    thumbLineLength = 35,
    classes,
    ...rest
  }: Props = $props()

  checkPlacement('Knob.Thumb', 'Knob.SVGRoot')
  const knob = useKnobContext()
  const angle = $derived(knob.angles.r1 + knob.angles.p * knob.angleRange)
</script>

<svg {...rest}>
  <circle cx="50%" cy="50%" r="{thumbSize / 2}%" fill={thumb} />
  <line
    class={classes?.thumbLine}
    x1="50%"
    y1="{(KNOB_VIEWBOX_SIZE - clamp(thumbSize, 0, 100)) / 2}%"
    x2="50%"
    y2="{thumbLineLength}%"
    stroke={thumbLine}
    stroke-width="{thumbLineWeight}%"
    style:transform="rotate({angle}deg)"
    style:transform-origin="50% 50%"
  />
</svg>
