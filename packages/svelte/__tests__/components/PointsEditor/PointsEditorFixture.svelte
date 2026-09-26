<script lang="ts">
  import { PointsEditor } from '../../../src/index.js'

  import type { PointPosition } from '@tremolo-ui/dom'

  type Props = {
    selectable?: boolean
    selection?: string[]
    onChange?: (id: string, value: PointPosition) => void
  }

  let {
    selectable = false,
    selection = $bindable([]),
    onChange,
  }: Props = $props()

  let points: Record<string, PointPosition> = $state({
    a: { x: 0.2, y: 0.5 },
    b: { x: 0.6, y: 0.5 },
  })
</script>

<PointsEditor.Root {selectable} bind:selection data-testid="root">
  <PointsEditor.Background data-testid="background" />
  <PointsEditor.Container data-testid="container">
    {#each Object.keys(points) as id (id)}
      <PointsEditor.Point
        {id}
        value={points[id]}
        data-testid="point-{id}"
        aria-label={{ x: `${id} x`, y: `${id} y` }}
        onChange={(v) => {
          points[id] = v
          onChange?.(id, v)
        }}
      />
    {/each}
    <PointsEditor.SelectionBox data-testid="box" />
  </PointsEditor.Container>
</PointsEditor.Root>
