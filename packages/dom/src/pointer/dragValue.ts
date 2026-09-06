import {
  clamp,
  linearScale,
  normalizeValue,
  stepValue,
  type ValueRange,
} from '@tremolo-ui/functions'

import { toXY, type XY, type XYInput } from '../xy'

import { createDrag, type DragState } from './drag'

/**
 * How the 0-1 travel of one axis maps onto a value.
 *
 * Extends `ValueRange` so that a drag and an `applyDelta` nudge from a wheel
 * or an arrow key share one description of the scaling.
 */
export interface AxisOptions extends ValueRange {
  /**
   * Flip the axis so that its far end is `min`.
   *
   * Positions follow the screen: x grows to the right, y downwards. A vertical
   * slider whose maximum is at the top therefore reverses its y axis.
   *
   * @default false
   */
  reverse?: boolean
}

/** Where the value of each axis currently sits, as a position (see {@link DragValueMapping}). */
export interface MappingContext {
  position: () => XY<number>
}

/**
 * Turns pointer movement into a position on each axis: 0 is the `min` end of
 * the travel and 1 the `max` end, before `reverse` and the scaling of
 * {@link AxisOptions} are applied.
 *
 * A mapping holds the state of the drag in progress, so an instance belongs to
 * a single {@link createDragValue} instance.
 */
export interface DragValueMapping {
  /**
   * @returns the position, or null when it cannot be determined and the event
   * should be ignored.
   */
  start: (state: DragState, context: MappingContext) => XY<number> | null
  move: (state: DragState, context: MappingContext) => XY<number> | null
}

/**
 * Map the pointer onto the bounding rect of an element: the value *is* the
 * position pointed at, so the middle of the element is 0.5.
 *
 * The element is read on every event, so it may be mounted after the drag is
 * set up and may change size while a drag is in progress.
 */
export function elementMapping(
  getElement: () => Element | null | undefined,
): DragValueMapping {
  function positionIn(state: DragState): XY<number> | null {
    const element = getElement()
    if (!element) return null
    const { left, top, right, bottom } = element.getBoundingClientRect()
    // A collapsed element has no travel to normalize against, and
    // normalizeValue rejects an empty range.
    return [
      right > left ? normalizeValue(state.clientX, left, right) : 0,
      bottom > top ? normalizeValue(state.clientY, top, bottom) : 0,
    ]
  }

  return { start: positionIn, move: positionIn }
}

/**
 * Move the value away from where it stood when the drag started, by the
 * distance dragged. The pointer position itself carries no meaning, so the
 * value can be adjusted from anywhere on the screen.
 */
export function relativeMapping({
  pixelRange = 100,
  sensitivity,
}: {
  /**
   * Pixels of movement that span the whole range.
   * @default 100
   */
  pixelRange?: XYInput<number>
  /**
   * How much the movement counts, read on every move. `1` is `pixelRange` as
   * given; `0.1` makes the same movement cover a tenth of the range, which is
   * what a fine-adjustment modifier wants.
   *
   * Changing it mid-drag does not disturb the value: the travel so far is
   * folded into the origin and measuring starts again from there.
   */
  sensitivity?: (state: DragState) => number
} = {}): DragValueMapping {
  const [baseX, baseY] = toXY(pixelRange)
  let origin: XY<number> = [0, 0]
  /** Where the current sensitivity took over, in drag coordinates. */
  let anchor: XY<number> = [0, 0]
  /** The previous event, so a sensitivity change can be dated back to it. */
  let previous: XY<number> = [0, 0]
  let factor = 1

  const travelled = (to: XY<number>, at: number): XY<number> => [
    origin[0] + ((to[0] - anchor[0]) * at) / baseX,
    origin[1] + ((to[1] - anchor[1]) * at) / baseY,
  ]

  return {
    start: (state, context) => {
      origin = context.position()
      anchor = [0, 0]
      previous = [0, 0]
      // Read here too, so a modifier already held when the pointer went down
      // applies from the first pixel rather than from the first change.
      factor = sensitivity ? sensitivity(state) : 1
      return origin
    },
    // Measured from the anchor rather than accumulated per event, so the
    // position picks up no rounding error of its own. The anchor only moves
    // when the sensitivity does, which is a handful of times per drag at most.
    move: (state) => {
      const next = sensitivity ? sensitivity(state) : 1
      if (next !== factor) {
        // Fold the travel so far into the origin, or the new sensitivity would
        // apply to the whole drag and the value would jump.
        //
        // Dated to the previous event rather than this one: a key produces no
        // pointer event of its own, so the change is only seen on the next
        // move, and that move's own distance belongs to the new sensitivity.
        origin = travelled(previous, factor)
        anchor = previous
        factor = next
      }
      previous = [state.x, state.y]
      return travelled([state.x, state.y], factor)
    },
  }
}

export interface DragValueOptions {
  /** Scaling of each axis; a single value applies to both. */
  axis: XYInput<AxisOptions>

  /** How pointer movement becomes a position. */
  mapping: DragValueMapping

  /**
   * The current value of each axis. Read when a drag starts, by mappings that
   * move the value relative to it, such as {@link relativeMapping}.
   */
  getValue?: () => XY<number>

  /**
   * Report the value on pointer down, before any movement.
   *
   * Enable it where the pointer position *is* the value, so that a plain click
   * jumps to it. Leave it off where the element being dragged is an object in
   * its own right, so that grabbing its edge does not shift it under the
   * pointer.
   *
   * @default false
   */
  updateOnPointerDown?: boolean

  /** @see DragOptions.threshold */
  threshold?: number
  /** @see DragOptions.cursor */
  cursor?: string

  onChange?: (value: XY<number>, state: DragState) => void
  onDragStart?: (value: XY<number>, state: DragState) => void
  onDragEnd?: (value: XY<number>, state: DragState) => void
}

export interface DragValueInstance {
  /**
   * Replace the given options. Lets a wrapper feed fresh values in without
   * tearing down the listeners, which would abort a drag in progress.
   *
   * `mapping` is fixed for the lifetime of the instance and is ignored here.
   */
  update: (options: Partial<DragValueOptions>) => void
  destroy: () => void
}

/**
 * Drive a value with a pointer drag.
 *
 * Combines {@link createDrag} with the scaling of `@tremolo-ui/functions`: the
 * mapping decides where the pointer sits on the 0-1 travel of each axis, and
 * the axis options turn that into a value.
 */
export function createDragValue(
  element: Element,
  options: DragValueOptions,
): DragValueInstance {
  let opts = options
  let lastValue: XY<number> = [0, 0]

  const axes = () => toXY(opts.axis)

  function valueOf(position: XY<number>): XY<number> {
    return axes().map((axis, i) => {
      const p = axis.reverse ? 1 - position[i] : position[i]
      // A scale clamps the position, so a mapping may report outside 0-1.
      const scale = axis.scale ?? linearScale
      const value = scale.denormalize(p, axis.min, axis.max)
      const stepped = axis.step ? stepValue(value, axis.step) : value
      // Rounding to the step can leave the range.
      return clamp(stepped, axis.min, axis.max)
    }) as XY<number>
  }

  const context: MappingContext = {
    position: () => {
      const getValue = opts.getValue
      if (!getValue) {
        throw new Error(
          'createDragValue: getValue is required by the given mapping',
        )
      }
      const value = getValue()
      return axes().map((axis, i) => {
        const scale = axis.scale ?? linearScale
        const n = scale.normalize(value[i], axis.min, axis.max)
        return axis.reverse ? 1 - n : n
      }) as XY<number>
    },
  }

  const drag = createDrag(element, {
    threshold: opts.threshold,
    cursor: opts.cursor,
    onDragStart: (state) => {
      const position = opts.mapping.start(state, context)
      if (position) {
        lastValue = valueOf(position)
        if (opts.updateOnPointerDown) opts.onChange?.(lastValue, state)
      }
      opts.onDragStart?.(lastValue, state)
    },
    onDrag: (state) => {
      const position = opts.mapping.move(state, context)
      if (!position) return
      lastValue = valueOf(position)
      opts.onChange?.(lastValue, state)
    },
    // The pointer has not moved since the last reported value, so `lastValue`
    // is where the drag ended.
    onDragEnd: (state) => opts.onDragEnd?.(lastValue, state),
  })

  return {
    update: (next) => {
      opts = { ...opts, ...next, mapping: opts.mapping }
      drag.update({ threshold: opts.threshold, cursor: opts.cursor })
    },
    destroy: () => drag.destroy(),
  }
}
