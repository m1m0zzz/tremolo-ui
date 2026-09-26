<script lang="ts">
  import {
    createDragValue,
    elementMapping,
    POINT_AXIS,
    wheelMove,
  } from '@tremolo-ui/dom'

  import { wheel as wheelAction } from '../../actions/wheel.js'
  import { setPlacement } from '../_util/placement.js'

  import { usePointsEditorContext } from './context.js'

  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = HTMLAttributes<HTMLDivElement> & {
    ref?: HTMLDivElement | null
    children?: Snippet
  }

  let { ref = $bindable(null), children, style, ...rest }: Props = $props()

  const points = usePointsEditorContext()
  setPlacement('PointsEditor.Container')

  // The container is what the pointer position is normalized against.
  $effect(() => {
    points.setContainer(ref)
    return () => points.setContainer(null)
  })

  // A drag on empty space draws a selection box. It is only attached while
  // there is a selection to draw: `createDrag` puts `touch-action: none` on
  // what it holds, and an editor that cannot select should not stop the page
  // scrolling under a finger.
  const selecting = $derived(points.selectable && !points.disabled)

  $effect(() => {
    const element = ref
    if (!element || !selecting) return
    const drag = createDragValue(element, {
      axis: POINT_AXIS,
      mapping: elementMapping(() => element),
      // A press that landed on a point belongs to that point. Declining here
      // rather than later matters: by then the container would already have
      // taken the pointer capture away from the point.
      shouldStart: (event) =>
        !points.editor.isPointElement(event.target as Element | null),
      onDragStart: ([x, y], state) =>
        points.editor.beginSelectionBox({ x, y }, state.event),
      onChange: ([x, y]) => points.editor.moveSelectionBox({ x, y }),
      onDragEnd: () => points.editor.endSelectionBox(),
    })
    return () => drag.destroy()
  })

  // One listener for the whole editor rather than one per point: a wheel
  // event only reaches what the cursor is over, and a point is a small target.
  const wheelOptions = {
    onWheel: (event: WheelEvent) => {
      // Scrolling up moves the point towards y = 0; shift switches to x.
      const move = wheelMove(event)
      if (!move) return
      const axis = move.axis === 0 ? 'x' : 'y'
      if (points.editor.nudgeFocusedPoint(axis, move.direction, event)) {
        event.preventDefault()
      }
    },
  }
</script>

<!-- The points inside are placed against this box, over the background and
  under the selection box. -->
<div
  bind:this={ref}
  style="position: absolute; inset: 0; z-index: 10; {style ?? ''}"
  use:wheelAction={wheelOptions}
  {...rest}
>
  {@render children?.()}
</div>
