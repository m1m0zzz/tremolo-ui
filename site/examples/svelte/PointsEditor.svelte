<script lang="ts">
  import { PointsEditor } from '@tremolo-ui/svelte'

  import type { PointPosition } from '@tremolo-ui/dom'

  // Copy this file from the Styling page into your own project.
  import pointsEditorTheme from './PointsEditor.module.css'

  let points: Record<string, PointPosition> = $state({
    'p-0': { x: 0, y: 0.5 },
    'p-1': { x: 0.35, y: 0.15 },
    'p-2': { x: 0.7, y: 0.85 },
    'p-3': { x: 1, y: 0.5 },
  })
</script>

<PointsEditor.Root class={pointsEditorTheme.root} selectable>
  <PointsEditor.Background style="background: #f2f4f5; border-radius: 4px" />
  <PointsEditor.Container>
    {#each Object.keys(points) as id (id)}
      <PointsEditor.Point
        class={pointsEditorTheme.point}
        {id}
        value={points[id]}
        onChange={(value) => (points[id] = value)}
      />
    {/each}
    <PointsEditor.SelectionBox class={pointsEditorTheme.selectionBox} />
  </PointsEditor.Container>
</PointsEditor.Root>
