<script lang="ts">
  import {
    applyDelta,
    arrowKeyMove,
    DEFAULT_DRAG_SENSITIVITY,
    DEFAULT_KEYBOARD_OPTIONS,
    DEFAULT_WHEEL_OPTIONS,
    elementMapping,
    selectModifier,
    toXY,
    valuePercent,
    wheelMove,
    type AxisMove,
    type AxisOptions,
    type InputEventOption,
    type ModifierState,
    type ModifierValue,
    type XY,
  } from '@tremolo-ui/dom'
  import { linearScale } from '@tremolo-ui/functions'

  import { dragValue } from '../../actions/drag-value.js'
  import { wheel as wheelAction } from '../../actions/wheel.js'
  import { useCheckSteps } from '../_util/check-steps.svelte.js'

  import { setXYPadContext } from './context.js'
  import type { XYPadProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = XYPadProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof XYPadProps>

  let {
    value = $bindable(),
    min: minProp,
    max: maxProp,
    step: stepProp = 1,
    scale: scaleProp = linearScale,
    reverse: reverseProp = false,
    wheel = DEFAULT_WHEEL_OPTIONS,
    keyboard = DEFAULT_KEYBOARD_OPTIONS,
    dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
    externalStyles,
    disabled = false,
    readonly = false,
    onChange,
    onDragStart,
    onDragEnd,
    ref = $bindable(null),
    children,
    onkeydown,
    onfocus,
    onblur,
    ...rest
  }: Props = $props()

  const inactive = $derived(disabled || readonly)
  const min = $derived(toXY(minProp))
  const max = $derived(toXY(maxProp))
  const step = $derived(toXY(stepProp))
  const scale = $derived(toXY(scaleProp))
  const reverse = $derived(toXY(reverseProp))

  const percent = $derived(
    [0, 1].map((i) =>
      valuePercent(
        value[i],
        { min: min[i], max: max[i], scale: scale[i] },
        reverse[i],
      ),
    ) as XY<number>,
  )
  // `reverse` only concerns the drag, where positions follow the screen; the
  // key and wheel handlers below flip the direction themselves.
  const axis = $derived(
    [0, 1].map((i) => ({
      min: min[i],
      max: max[i],
      step: step[i],
      scale: scale[i],
      reverse: reverse[i],
    })) as XY<AxisOptions>,
  )

  let area: HTMLElement | null = null
  let thumb: HTMLInputElement | null = null

  useCheckSteps(() => ({
    component: 'XYPad',
    axis: 'x',
    range: axis[0],
    keyboard,
    wheel,
  }))
  useCheckSteps(() => ({
    component: 'XYPad',
    axis: 'y',
    range: axis[1],
    keyboard,
    wheel,
  }))

  function change(next: XY<number>) {
    value = next
    onChange?.(next)
  }

  /** Move one axis by one press of `option`, in screen coordinates. */
  function nudge(
    { axis: i, direction }: AxisMove,
    option: ModifierValue<InputEventOption>,
    modifiers: ModifierState,
  ) {
    const next = applyDelta(
      value[i],
      reverse[i] ? -direction : direction,
      option,
      axis[i],
      modifiers,
    )
    change(i === 0 ? [next, value[1]] : [value[0], next])
  }

  setXYPadContext({
    get value() {
      return value
    },
    get min() {
      return min
    },
    get max() {
      return max
    },
    get step() {
      return step
    },
    get scale() {
      return scale
    },
    get reverse() {
      return reverse
    },
    get disabled() {
      return disabled
    },
    get readonly() {
      return readonly
    },
    get percent() {
      return percent
    },
    change,
    setArea: (element) => {
      area = element
    },
    setThumb: (input) => {
      thumb = input
    },
  })

  const dragOptions = $derived({
    axis,
    mapping: elementMapping(() => area, {
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
    }),
    updateOnPointerDown: true,
    cursor: inactive ? undefined : (externalStyles?.cursor ?? 'pointer'),
    shouldStart: () => !inactive,
    onChange: (v: XY<number>) => {
      if (!inactive) change(v)
    },
    onDragStart: (v: XY<number>) => {
      if (inactive) return
      thumb?.focus()
      onDragStart?.(v)
    },
    onDragEnd: (v: XY<number>) => {
      if (!inactive) onDragEnd?.(v)
    },
  })

  const wheelOptions = $derived({
    requireFocus: true,
    onWheel: (event: WheelEvent) => {
      if (!wheel || inactive) return
      const move = wheelMove(event)
      if (!move) return
      event.preventDefault()
      nudge(move, wheel, event)
    },
  })

  /** Move the focus to the thumb. */
  export function focus() {
    if (!disabled) thumb?.focus()
  }

  /** Take the focus away from the thumb. */
  export function blur() {
    thumb?.blur()
  }
</script>

<!-- The group handles the pointer and keyboard input shared by its two range
  controls. -->
<div
  bind:this={ref}
  role="group"
  tabindex="-1"
  data-disabled={disabled ? '' : undefined}
  data-readonly={readonly ? '' : undefined}
  use:dragValue={dragOptions}
  use:wheelAction={wheelOptions}
  onkeydown={(event) => {
    // The key picks the axis, whichever of the two inputs holds the focus:
    // the focus lands on the x input, so reading the axis off the input would
    // leave the y axis with no keys at all.
    const move = arrowKeyMove(event.key)
    if (move) {
      event.preventDefault()
      if (keyboard && !inactive) nudge(move, keyboard, event)
    }
    onkeydown?.(event)
  }}
  onfocus={(event) => {
    if (!disabled) thumb?.focus()
    onfocus?.(event)
  }}
  onblur={(event) => {
    thumb?.blur()
    onblur?.(event)
  }}
  {...rest}
>
  {@render children()}
</div>
