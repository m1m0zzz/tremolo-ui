<script lang="ts">
  import {
    createPointsEditor,
    DEFAULT_DRAG_SENSITIVITY,
    POINTS_EDITOR_DEFAULT_KEYBOARD,
    POINTS_EDITOR_DEFAULT_WHEEL,
    type SelectionBoxRect,
  } from '@tremolo-ui/dom'

  import { setPointsEditorContext } from './context.js'
  import type { PointsEditorProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = PointsEditorProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof PointsEditorProps>

  let {
    disabled = false,
    readonly = false,
    externalStyles,
    wheel = POINTS_EDITOR_DEFAULT_WHEEL,
    keyboard = POINTS_EDITOR_DEFAULT_KEYBOARD,
    dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
    selectable = false,
    selection = $bindable([]),
    onSelectionChange,
    ref = $bindable(null),
    children,
    style,
    ...rest
  }: Props = $props()

  let selectionBox: SelectionBoxRect | null = $state(null)
  let container: HTMLElement | null = $state(null)

  // Nothing is selected while selection is off, so a drag picks up only the
  // point it started on and `data-selected` never turns on.
  const current = $derived(selectable ? selection : [])

  // The selection lives here, where Svelte state can hold it; which points a
  // press or a box selects, and how a selection moves, is the core's.
  const editor = createPointsEditor({
    onSelectionBoxChange: (rect) => {
      selectionBox = rect
    },
    onSelectionChange: (next) => {
      selection = next
      onSelectionChange?.(next)
    },
  })

  // Pushed before the DOM updates, so that the next press already sees it.
  $effect.pre(() => {
    editor.update({ selectable, selection: current })
  })

  $effect(() => () => editor.destroy())

  setPointsEditorContext({
    get disabled() {
      return disabled
    },
    get readonly() {
      return readonly
    },
    get wheel() {
      return wheel
    },
    get keyboard() {
      return keyboard
    },
    get dragSensitivity() {
      return dragSensitivity
    },
    get cursor() {
      return externalStyles?.cursor ?? 'grabbing'
    },
    get selectable() {
      return selectable
    },
    get selection() {
      return current
    },
    get selectionBox() {
      return selectionBox
    },
    get container() {
      return container
    },
    editor,
    setContainer: (element) => {
      container = element
    },
  })
</script>

<!-- The layers inside are placed against this box. -->
<div
  bind:this={ref}
  data-disabled={disabled ? '' : undefined}
  data-readonly={readonly ? '' : undefined}
  style="position: relative; {style ?? ''}"
  {...rest}
>
  {@render children()}
</div>
