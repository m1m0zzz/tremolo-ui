import {
  clamp,
  normalizeValue,
  rawValue,
  stepValue,
} from '@tremolo-ui/functions'

import { toXY, type XY, type XYOrSingle } from '../xy'

import { createDrag, type DragState } from './drag'

/** How the 0-1 travel of one axis maps onto a value. */
export interface AxisOptions {
  min: number
  max: number
  /**
   * Rounding applied to the value. Left unrounded when omitted.
   */
  step?: number
  /** @default 1 */
  skew?: number
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
}: {
  /**
   * Pixels of movement that span the whole range.
   * @default 100
   */
  pixelRange?: XYOrSingle<number>
} = {}): DragValueMapping {
  const [rangeX, rangeY] = toXY(pixelRange)
  let origin: XY<number> = [0, 0]

  return {
    start: (_state, context) => {
      origin = context.position()
      return origin
    },
    // `x` and `y` are measured from the start of the drag, so the position
    // never accumulates a rounding error of its own.
    move: (state) => [
      origin[0] + state.x / rangeX,
      origin[1] + state.y / rangeY,
    ],
  }
}

export interface DragValueOptions {
  /** Scaling of each axis; a single value applies to both. */
  axis: XYOrSingle<AxisOptions>

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
      // rawValue clamps the position, so a mapping may report outside 0-1.
      const value = rawValue(p, axis.min, axis.max, axis.skew ?? 1)
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
        const n = normalizeValue(value[i], axis.min, axis.max, axis.skew ?? 1)
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
