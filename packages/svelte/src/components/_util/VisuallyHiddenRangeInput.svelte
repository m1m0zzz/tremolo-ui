<script lang="ts">
  import { visuallyHidden } from './style.js'

  import type { HTMLInputAttributes } from 'svelte/elements'

  type Props = Omit<HTMLInputAttributes, 'type' | 'style'> & {
    ref?: HTMLInputElement | null
  }

  let { ref = $bindable(null), ...rest }: Props = $props()
</script>

<!--
  The control underneath a headless part: out of sight, but in the
  accessibility tree and the tab order, carrying the ARIA and the keyboard.
-->
<input bind:this={ref} {...rest} type="range" style={visuallyHidden} />
