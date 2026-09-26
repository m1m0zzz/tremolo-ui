<script lang="ts">
  import { PointsEditor } from '../src/index.js'

  import type { PointPosition } from '@tremolo-ui/dom'

  import pointsEditorTheme from 'shared/css/PointsEditor.module.css'

  /** An envelope-like set of points that can be selected and moved together. */
  let { selectable = true }: { selectable?: boolean } = $props()

  let points: Record<string, PointPosition> = $state({
    a: { x: 0.1, y: 0.8 },
    b: { x: 0.3, y: 0.2 },
    c: { x: 0.6, y: 0.4 },
    d: { x: 0.9, y: 0.8 },
  })

  const path = $derived(
    Object.values(points)
      .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'} ${x * 200} ${y * 100}`)
      .join(' '),
  )
</script>

<PointsEditor.Root
  class={pointsEditorTheme.root}
  {selectable}
  style="width: 400px; height: 200px"
>
  <PointsEditor.Background>
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <path d={path} fill="none" stroke="currentColor" />
    </svg>
  </PointsEditor.Background>
  <PointsEditor.Container>
    {#each Object.keys(points) as id (id)}
      <PointsEditor.Point
        {id}
        class={pointsEditorTheme.point}
        value={points[id]}
        aria-label={{ x: `${id} time`, y: `${id} level` }}
        onChange={(v) => (points[id] = v)}
      />
    {/each}
    <PointsEditor.SelectionBox class={pointsEditorTheme.selectionBox} />
  </PointsEditor.Container>
</PointsEditor.Root>
