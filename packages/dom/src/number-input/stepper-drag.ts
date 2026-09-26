import { type ValueRange } from '@tremolo-ui/functions'

import { applyDelta } from '../input/apply-delta'
import { DEFAULT_DRAG_SENSITIVITY } from '../input/defaults'
import {
  mapModifier,
  selectModifier,
  type InputEventOption,
  type ModifierValue,
} from '../input/modifiers'
import { createDrag } from '../pointer/drag'

export interface StepperDragOptions {
  /** The value now, read when the drag starts moving it. */
  getValue: () => number
  /**
   * The range the value moves across. Its `step` is what one step of the drag
   * is worth; see `numberInputRanges` for the one a number input uses.
   */
  range: ValueRange
  /**
   * How many pixels of vertical movement make one step.
   *
   * @default 1
   */
  pixels?: number
  /**
   * How much a step is worth, per modifier key: `0.1` makes the same movement
   * count a tenth as much. Pressing or releasing the key mid-drag does not
   * move the value.
   *
   * @default { default: 1, shift: 0.1 }
   */
  sensitivity?: ModifierValue<number>
  /** Hide the pointer and keep it from hitting the edge of the screen. */
  pointerLock?: boolean
  /** Called with the new value whenever the drag moves it. */
  onChange: (value: number) => void
}

export interface StepperDragInstance {
  /** Replace the given options. `pointerLock` reaches the next drag. */
  update: (options: Partial<StepperDragOptions>) => void
  /**
   * Whether the drag in progress has moved the value. A stepper button's
   * press-and-hold repeat stands down once it has, so the value is not moved
   * twice.
   */
  moved: () => boolean
  destroy: () => void
}

/**
 * Drag up and down on the steppers of a number input to move its value, one
 * `step` every `pixels` — up raises it, as on a knob.
 *
 * Counted from where the drag started moving rather than added up per
 * event, so rounding cannot accumulate. The start is taken on the first
 * move, not on pointerdown: a stepper button acts on pointerdown, so by then
 * the value may already have been nudged once, and the drag carries on from
 * there.
 */
export function createStepperDrag(
  element: Element,
  options: StepperDragOptions,
): StepperDragInstance {
  let opts = options
  let origin: { y: number; value: number } | null = null
  let moved = false
  /**
   * Which sensitivity the drag is counting at, and where the previous event
   * was — a key produces no pointer event of its own, so a change is only
   * seen on the next move and has to be dated back to the one before it.
   */
  let factor = 1
  let previousY = 0

  const drag = createDrag(element, {
    threshold: 1,
    cursor: 'ns-resize',
    pointerLock: opts.pointerLock,
    onDragStart: (state) => {
      origin = null
      moved = false
      factor = selectModifier(
        opts.sensitivity ?? DEFAULT_DRAG_SENSITIVITY,
        state.event,
      ).value
    },
    onDrag: (state) => {
      const { y } = state
      if (!origin) {
        origin = { y, value: opts.getValue() }
        previousY = y
        return
      }

      const sensitivity = opts.sensitivity ?? DEFAULT_DRAG_SENSITIVITY
      // Pressing or releasing the key mid-drag must not move the value, so the
      // travel so far is folded into the origin and measuring starts again
      // from the previous event: that event's own distance belongs to the new
      // sensitivity.
      const next = selectModifier(sensitivity, state.event).value
      if (next !== factor) {
        origin = { y: previousY, value: opts.getValue() }
        factor = next
      }
      previousY = y

      const steps = Math.round(-(y - origin.y) / (opts.pixels ?? 1))
      if (steps === 0) return
      moved = true

      // The sensitivity as an amount per step, carried over as a modifier map
      // rather than resolved here: that keeps `step` out of the pipeline for
      // a modifier entry, since naming one is a request to move off the grid.
      const step = opts.range.step ?? 1
      const amounts = mapModifier(sensitivity, (f): InputEventOption => [
        'raw',
        step * f,
      ])
      opts.onChange(
        applyDelta(origin.value, steps, amounts, opts.range, state.event),
      )
    },
    onDragEnd: () => {
      moved = false
    },
  })

  return {
    update: (next) => {
      opts = { ...opts, ...next }
      if ('pointerLock' in next) drag.update({ pointerLock: opts.pointerLock })
    },
    moved: () => moved,
    destroy: () => drag.destroy(),
  }
}
