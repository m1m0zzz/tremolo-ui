<script lang="ts">
  import { knobArcPath, knobArcRadius } from '@tremolo-ui/dom'

  import { checkPlacement } from '../_util/placement.js'

  import { useKnobContext } from './context.js'

  import type { SVGAttributes } from 'svelte/elements'

  type Props = Omit<SVGAttributes<SVGPathElement>, 'd'>

  let {
    stroke = 'currentColor',
    'stroke-width': strokeWidth = 6,
    ...rest
  }: Props = $props()

  checkPlacement('Knob.ActiveLine', 'Knob.SVGRoot')
  const knob = useKnobContext()
  const radius = $derived(knobArcRadius(strokeWidth ?? undefined))
</script>

<path
  d={knobArcPath(knob.angles.r2, knob.angles.r3, radius)}
  fill="none"
  {stroke}
  stroke-width={strokeWidth}
  {...rest}
/>
