<script lang="ts">
  import {
    arrowKeyMove,
    clampPoint,
    createDragValue,
    elementMapping,
    POINT_AXIS,
    selectModifier,
    type PointPosition,
    type PointsEditorPoint,
  } from '@tremolo-ui/dom'
  import { untrack } from 'svelte'

  import { checkPlacement } from '../_util/placement.js'
  import VisuallyHiddenRangeInput from '../_util/VisuallyHiddenRangeInput.svelte'

  import { usePointsEditorContext } from './context.js'
  import type { PointsEditorPointProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = PointsEditorPointProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof PointsEditorPointProps>

  let {
    value,
    id: idProp,
    min,
    max,
    color,
    disabled: disabledProp,
    readonly: readonlyProp,
    wheel: wheelProp,
    keyboard: keyboardProp,
    'aria-label': ariaLabel,
    'aria-valuetext': ariaValuetext,
    onChange,
    onDragStart,
    onDragEnd,
    children,
    style,
    onfocus,
    onkeydown,
    ...rest
  }: Props = $props()

  const points = usePointsEditorContext()
  checkPlacement('PointsEditor.Point', 'PointsEditor.Container')

  const generatedId = $props.id()
  const id = $derived(idProp ?? generatedId)
  const disabled = $derived(disabledProp ?? points.disabled)
  const readonly = $derived(readonlyProp ?? points.readonly)
  const inactive = $derived(disabled || readonly)
  // `null` means "no event" and has to survive the fallback, so `??` is not
  // enough: only an omitted prop inherits from the root.
  const wheel = $derived(wheelProp === undefined ? points.wheel : wheelProp)
  const keyboard = $derived(
    keyboardProp === undefined ? points.keyboard : keyboardProp,
  )
  const selected = $derived(points.selection.includes(id))
  const current = $derived(clampPoint(value, min, max))

  let element: HTMLDivElement | null = $state(null)
  let xInput: HTMLInputElement | null = $state(null)
  let dragging = $state(false)

  // Read by the editor whenever it moves the selection, so the value can
  // change on every frame of a drag without registering again.
  const read = (): PointsEditorPoint => ({
    value,
    min,
    max,
    readonly: inactive,
    onChange,
    element,
    wheel,
  })

  $effect(() => points.editor.registerPoint(id, read))

  /** Where the pointer was when the drag started, to measure the move from. */
  let origin: PointPosition | null = null

  $effect(() => {
    const node = element
    if (!node) return
    // The value is the position itself: no scaling, and no rounding to a step.
    const drag = createDragValue(node, {
      axis: POINT_AXIS,
      mapping: elementMapping(() => points.container, {
        sensitivity: (state) =>
          selectModifier(points.dragSensitivity, state.event).value,
      }),
      cursor: untrack(() => (inactive ? undefined : points.cursor)),
      shouldStart: () => !disabled,
      // The value is a move rather than a position: the point keeps the
      // offset it was grabbed at, and everything else selected moves with it.
      onChange: ([x, y]) => {
        if (origin)
          points.editor.movePointDrag({ x: x - origin.x, y: y - origin.y })
      },
      onDragStart: ([x, y], state) => {
        points.editor.beginPointDrag(id, state.event)
        origin = { x, y }
        dragging = true
        xInput?.focus()
        if (!inactive) onDragStart?.(clampPoint(value, min, max))
      },
      onDragEnd: () => {
        origin = null
        dragging = false
        if (!inactive) onDragEnd?.(clampPoint(value, min, max))
      },
    })
    $effect(() => {
      drag.update({ cursor: inactive ? undefined : points.cursor })
    })
    return () => drag.destroy()
  })

  function perAxis(
    setting: string | Partial<Record<'x' | 'y', string>> | undefined,
    axis: 'x' | 'y',
  ) {
    return typeof setting === 'string' ? setting : setting?.[axis]
  }

  function onInput(axis: 'x' | 'y', target: HTMLInputElement) {
    if (readonly) {
      target.value = String(current[axis])
      return
    }
    const delta = target.valueAsNumber - value[axis]
    points.editor.nudgeSelection(id, {
      x: axis === 'x' ? delta : 0,
      y: axis === 'y' ? delta : 0,
    })
  }
</script>

<!-- The visual point has two values, so its semantics live on the two range
  inputs nested inside it rather than on this drag handle. A press lands on
  the point, which cannot hold focus, and the browser answers that by
  clearing the focus — tabindex -1 keeps it inside. -->
<div
  bind:this={element}
  tabindex="-1"
  role="presentation"
  data-disabled={disabled ? '' : undefined}
  data-readonly={readonly ? '' : undefined}
  data-dragging={dragging ? '' : undefined}
  data-selected={selected ? '' : undefined}
  {...rest}
  style="position: absolute; translate: var(--translate, -50% -50%); {style ??
    ''}"
  style:--color={color}
  style:left="{value.x * 100}%"
  style:top="{value.y * 100}%"
  onfocus={(event) => {
    // The point itself is not the control: whatever reaches it is handed to
    // the first input.
    if (!disabled && event.target === event.currentTarget) xInput?.focus()
    onfocus?.(event)
  }}
  onkeydown={(event) => {
    // The key picks the axis, whichever of the two inputs holds the focus.
    // y grows downwards, so ArrowUp moves the point towards 0.
    const move = arrowKeyMove(event.key)
    if (move) {
      event.preventDefault()
      if (onChange && !inactive && keyboard) {
        points.editor.nudgePoint(
          id,
          move.axis === 0 ? 'x' : 'y',
          move.direction,
          keyboard,
          event,
        )
      }
    }
    onkeydown?.(event)
  }}
>
  <VisuallyHiddenRangeInput
    bind:ref={xInput}
    data-axis="x"
    value={current.x}
    min={min?.x ?? 0}
    max={max?.x ?? 1}
    step="any"
    {disabled}
    aria-readonly={readonly}
    aria-orientation="horizontal"
    aria-label={perAxis(ariaLabel, 'x') ?? 'x'}
    aria-valuetext={perAxis(ariaValuetext, 'x')}
    oninput={(event) => onInput('x', event.currentTarget)}
  />
  <VisuallyHiddenRangeInput
    data-axis="y"
    value={current.y}
    min={min?.y ?? 0}
    max={max?.y ?? 1}
    step="any"
    {disabled}
    aria-readonly={readonly}
    aria-orientation="vertical"
    aria-label={perAxis(ariaLabel, 'y') ?? 'y'}
    aria-valuetext={perAxis(ariaValuetext, 'y')}
    oninput={(event) => onInput('y', event.currentTarget)}
  />
  {@render children?.()}
</div>
