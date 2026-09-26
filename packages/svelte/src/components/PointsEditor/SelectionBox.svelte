<script lang="ts">
  import { checkPlacement } from '../_util/placement.js'

  import { usePointsEditorContext } from './context.js'

  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet }

  let { children, style, ...rest }: Props = $props()

  const points = usePointsEditorContext()
  checkPlacement('PointsEditor.SelectionBox', 'PointsEditor.Container')
</script>

<!-- Drawn over the points while a drag runs, and taking none of the pointer:
  the drag underneath is what it is reporting on. Nothing is rendered while no
  drag is running. -->
{#if points.selectionBox}
  {@const box = points.selectionBox}
  <div
    {...rest}
    style="position: absolute; z-index: 20; pointer-events: none; {style ?? ''}"
    style:left="{box.x * 100}%"
    style:top="{box.y * 100}%"
    style:width="{box.width * 100}%"
    style:height="{box.height * 100}%"
  >
    {@render children?.()}
  </div>
{/if}
