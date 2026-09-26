<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet }

  let { children, style, ...rest }: Props = $props()
</script>

<!-- Behind the points, filling the editor. The order of the layers holds
  whichever way they are written, so the z-index is part of the mechanics. -->
<div style="position: absolute; inset: 0; z-index: 0; {style ?? ''}" {...rest}>
  {@render children?.()}
</div>
