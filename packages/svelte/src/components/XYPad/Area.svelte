<script lang="ts">
  import { setPlacement } from '../_util/placement.js'

  import { useXYPadContext } from './context.js'

  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = HTMLAttributes<HTMLDivElement> & {
    ref?: HTMLDivElement | null
    children?: Snippet
  }

  let { ref = $bindable(null), children, style, ...rest }: Props = $props()

  const pad = useXYPadContext()
  setPlacement('XYPad.Area')

  // The area is what the pointer position is normalized against.
  $effect(() => {
    pad.setArea(ref)
    return () => pad.setArea(null)
  })
</script>

<!-- The thumb inside is placed against this box. -->
<div bind:this={ref} style="position: relative; {style ?? ''}" {...rest}>
  {@render children?.()}
</div>
