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
    color = 'currentColor',
    lineColor = 'currentColor',
    size = 84,
    lineWeight = 6,
    lineLength = 35,
    classes,
    ...rest
  }: Props = $props()

  checkPlacement('Knob.Thumb', 'Knob.SVGRoot')
  const knob = useKnobContext()
  const angle = $derived(knob.angles.r1 + knob.angles.p * knob.angleRange)
</script>

<svg {...rest}>
  <circle cx="50%" cy="50%" r="{size / 2}%" fill={color} />
  <line
    class={classes?.line}
    x1="50%"
    y1="{(KNOB_VIEWBOX_SIZE - clamp(size, 0, 100)) / 2}%"
    x2="50%"
    y2="{lineLength}%"
    stroke={lineColor}
    stroke-width="{lineWeight}%"
    style:transform="rotate({angle}deg)"
    style:transform-origin="50% 50%"
  />
</svg>
