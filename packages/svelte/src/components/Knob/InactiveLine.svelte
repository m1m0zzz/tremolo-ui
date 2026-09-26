<script lang="ts">
  import { knobArcPath, knobArcRadius } from '@tremolo-ui/dom'

  import { checkPlacement } from '../_util/placement.js'

  import { useKnobContext } from './context.js'

  import type { SVGAttributes } from 'svelte/elements'

  type Props = Omit<SVGAttributes<SVGPathElement>, 'd'>

  let { stroke = 'currentColor', 'stroke-width': strokeWidth = 6, ...rest }: Props =
    $props()

  checkPlacement('Knob.InactiveLine', 'Knob.SVGRoot')
  const knob = useKnobContext()
  const radius = $derived(knobArcRadius(strokeWidth ?? undefined))
</script>

<!-- The travel on either side of the active arc. -->
{#if knob.startValue > knob.min}
  <path
    d={knobArcPath(knob.angles.r1, knob.angles.r2, radius)}
    fill="none"
    {stroke}
    stroke-width={strokeWidth}
    {...rest}
  />
{/if}
{#if knob.startValue < knob.max}
  <path
    d={knobArcPath(knob.angles.r3, knob.angles.r4, radius)}
    fill="none"
    {stroke}
    stroke-width={strokeWidth}
    {...rest}
  />
{/if}
