<script lang="ts">
  import {
    applyDelta,
    arrowKeyDirection,
    DEFAULT_DRAG_SENSITIVITY,
    DEFAULT_KEYBOARD_OPTIONS,
    DEFAULT_WHEEL_OPTIONS,
    elementMapping,
    selectModifier,
    valuePercent,
    wheelDirection,
    type AxisOptions,
    type XY,
  } from '@tremolo-ui/dom'
  import { linearScale } from '@tremolo-ui/functions'

  import { dragValue } from '../../actions/drag-value.js'
  import { wheel as wheelAction } from '../../actions/wheel.js'
  import { useCheckSteps } from '../_util/check-steps.svelte.js'

  import { setSliderContext } from './context.js'
  import type { SliderProps } from './types.js'

  import type { HTMLAttributes } from 'svelte/elements'

  type Props = SliderProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof SliderProps>

  let {
    value = $bindable(),
    min,
    max,
    step = 1,
    scale = linearScale,
    vertical = false,
    reverse = false,
    externalStyles,
    wheel = DEFAULT_WHEEL_OPTIONS,
    keyboard = DEFAULT_KEYBOARD_OPTIONS,
    dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
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
  // Measured from the left or the top, as CSS places things:
  // normal -> normal (right)
  // vertical -> reversed (up)
  // reverse -> reversed (left)
  // vertical & reverse -> normal (down)
  const displayReversed = $derived(vertical !== reverse)
  const percent = $derived(
    valuePercent(value, { min, max, scale }, displayReversed),
  )
  // The pointer is normalized against the track on both axes; only the one
  // the slider runs along is read back.
  const axis: AxisOptions = $derived({
    min,
    max,
    step,
    scale,
    reverse: displayReversed,
  })

  let track: HTMLElement | null = null
  let thumb: HTMLInputElement | null = null

  useCheckSteps(() => ({ component: 'Slider', range: axis, keyboard, wheel }))

  function change(next: number) {
    value = next
    onChange?.(next)
  }

  setSliderContext({
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
    get vertical() {
      return vertical
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
    setTrack: (element) => {
      track = element
    },
    setThumb: (input) => {
      thumb = input
    },
  })

  const valueOf = (v: XY<number>) => v[vertical ? 1 : 0]

  const dragOptions = $derived({
    axis,
    mapping: elementMapping(() => track, {
      sensitivity: (state) =>
        selectModifier(dragSensitivity, state.event).value,
    }),
    cursor: inactive ? undefined : (externalStyles?.cursor ?? 'pointer'),
    shouldStart: () => !inactive,
    updateOnPointerDown: true,
    onChange: (v: XY<number>) => {
      if (!inactive) change(valueOf(v))
    },
    onDragStart: (v: XY<number>) => {
      if (inactive) return
      thumb?.focus()
      onDragStart?.(valueOf(v))
    },
    onDragEnd: (v: XY<number>) => {
      if (!inactive) onDragEnd?.(valueOf(v))
    },
  })

  const wheelOptions = $derived({
    requireFocus: true,
    onWheel: (event: WheelEvent) => {
      if (!wheel || inactive) return
      // A notch the slider does not read — a sideways scroll on a vertical
      // slider — is left to the page rather than swallowed.
      const direction = wheelDirection(event, { horizontal: !vertical })
      if (direction === null) return
      event.preventDefault()
      change(
        applyDelta(value, reverse ? -direction : direction, wheel, axis, event),
      )
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

<!-- The group is the pointer and keyboard event area; the range input inside
  the thumb carries the control semantics. A press lands on the track or the
  thumb, neither of which can hold focus, and the browser answers that by
  clearing the focus — tabindex -1 keeps it inside, and onfocus passes it to
  the input. -->
<div
  bind:this={ref}
  role="group"
  tabindex="-1"
  data-orientation={vertical ? 'vertical' : 'horizontal'}
  data-disabled={disabled ? '' : undefined}
  data-readonly={readonly ? '' : undefined}
  use:dragValue={dragOptions}
  use:wheelAction={wheelOptions}
  onkeydown={(event) => {
    const direction = arrowKeyDirection(event.key)
    if (direction !== null) {
      event.preventDefault()
      if (keyboard && !inactive) {
        change(
          applyDelta(
            value,
            reverse ? -direction : direction,
            keyboard,
            axis,
            event,
          ),
        )
      }
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
