<script lang="ts">
  import {
    DEFAULT_DRAG_SENSITIVITY,
    DEFAULT_KEYBOARD_OPTIONS,
    DEFAULT_WHEEL_OPTIONS,
    knobAngles,
    relativeMapping,
    type AxisOptions,
    type XY,
  } from '@tremolo-ui/dom'
  import {
    applyDelta,
    arrowKeyDirection,
    cssLength,
    selectModifier,
    wheelDirection,
  } from '@tremolo-ui/dom/internal'
  import { linearScale, type ValueRange } from '@tremolo-ui/functions'

  import { dragValue } from '../../actions/drag-value.js'
  import { wheel as wheelAction } from '../../actions/wheel.js'
  import { useChangeGesture } from '../_util/change-gesture.svelte.js'
  import { useCheckSteps } from '../_util/check-steps.svelte.js'

  import { setKnobContext } from './context.js'
  import type { KnobProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = KnobProps & Omit<HTMLAttributes<HTMLDivElement>, keyof KnobProps>

  let {
    value = $bindable(),
    min,
    max,
    step = 1,
    scale = linearScale,
    resetValue,
    startValue,
    size,
    dragCursor = 'grabbing',
    wheel = DEFAULT_WHEEL_OPTIONS,
    keyboard = DEFAULT_KEYBOARD_OPTIONS,
    dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
    pointerLock = false,
    disabled = false,
    readonly = false,
    angleRange = 270,
    onChange,
    onChangeStart,
    onChangeEnd,
    changeEndDelay,
    ref = $bindable(null),
    children,
    style,
    onkeydown,
    ondblclick,
    ...rest
  }: Props = $props()

  const inactive = $derived(disabled || readonly)
  const range: ValueRange = $derived({ min, max, step, scale })
  const angles = $derived(
    knobAngles({
      value,
      min,
      max,
      scale,
      startValue: startValue ?? min,
      angleRange,
    }),
  )
  let dragging = $state(false)

  useCheckSteps(() => ({ component: 'Knob', range, keyboard, wheel }))

  setKnobContext({
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
    get startValue() {
      return startValue ?? min
    },
    get angleRange() {
      return angleRange
    },
    get angles() {
      return angles
    },
  })

  function change(next: number) {
    value = next
    onChange?.(next)
  }

  const gesture = useChangeGesture(() => ({
    value,
    inactive,
    onChangeStart,
    onChangeEnd,
    changeEndDelay,
  }))

  // The knob has no travel of its own: the value moves away from where it
  // stood when the drag started, 100px of movement spanning the whole range.
  // Only the vertical axis carries a value, reversed so that dragging up
  // raises it. `mapping` is read once, when the action starts; the rest is
  // handed over as it changes.
  const dragOptions = $derived({
    axis: [range, { ...range, reverse: true }] as XY<AxisOptions>,
    mapping: relativeMapping({
      pixelRange: 100,
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
    }),
    getValue: (): XY<number> => [value, value],
    threshold: 1,
    cursor: inactive ? undefined : dragCursor,
    pointerLock: inactive ? false : pointerLock,
    shouldStart: () => !inactive,
    onChange: (v: XY<number>) => {
      if (!inactive) change(v[1])
    },
    onDragStart: () => {
      dragging = true
      if (!inactive) gesture.hold('pointer')
    },
    onDragEnd: () => {
      dragging = false
      gesture.end()
    },
  })

  const wheelOptions = $derived({
    requireFocus: true,
    onWheel: (event: WheelEvent) => {
      if (!wheel || inactive) return
      // A notch the knob does not read — a sideways scroll — is left to the
      // page rather than swallowed.
      const direction = wheelDirection(event)
      if (direction === null) return
      event.preventDefault()
      gesture.pulse('wheel')
      change(applyDelta(value, direction, wheel, range, event))
    },
  })

  /** Move the focus to the knob. */
  export function focus() {
    if (!disabled) ref?.focus()
  }

  /** Take the focus away from the knob. */
  export function blur() {
    ref?.blur()
  }
</script>

<div
  bind:this={ref}
  role="slider"
  tabindex={disabled ? -1 : 0}
  aria-valuenow={value}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-disabled={disabled}
  aria-readonly={readonly}
  data-disabled={disabled ? '' : undefined}
  data-readonly={readonly ? '' : undefined}
  data-dragging={dragging ? '' : undefined}
  {style}
  style:--knob-size={cssLength(size)}
  use:dragValue={dragOptions}
  use:wheelAction={wheelOptions}
  onkeydown={(event) => {
    if (keyboard && !inactive) {
      const direction = arrowKeyDirection(event.key)
      if (direction !== null) {
        event.preventDefault()
        gesture.pulse('keyboard')
        change(applyDelta(value, direction, keyboard, range, event))
      }
    }
    onkeydown?.(event)
  }}
  ondblclick={(event) => {
    if (!inactive && resetValue !== null) {
      gesture.instant('doubleClick', () =>
        change(resetValue ?? startValue ?? min),
      )
    }
    ondblclick?.(event)
  }}
  {...rest}
>
  {@render children()}
</div>
