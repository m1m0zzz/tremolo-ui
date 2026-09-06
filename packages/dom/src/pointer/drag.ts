export type DragState = {
  /** Total movement from the drag start, in screen coordinates. */
  x: number
  y: number
  /** Movement since the previous event, in screen coordinates. */
  deltaX: number
  deltaY: number
  /** Pointer position in viewport coordinates. */
  clientX: number
  clientY: number
  /**
   * Which pointer this is. Always the same value for one drag; with
   * {@link DragOptions.multiPointer} it tells concurrent drags apart.
   */
  pointerId: number
  event: PointerEvent
}

export type DragOptions = {
  /**
   * Minimum movement in pixels before `onDrag` fires. Movement below it is
   * carried over to the next event rather than discarded, so a slow drag still
   * reports once it adds up.
   *
   * Prevents `onDrag` from firing on, for example, a double click.
   *
   * @default 0
   */
  threshold?: number

  /**
   * CSS cursor to show while dragging. Applied to the element itself: pointer
   * capture keeps it in effect even once the pointer leaves the element, so
   * there is no need to touch the document.
   *
   * With {@link DragOptions.multiPointer} it is set for the first pointer and
   * restored once the last one is up.
   */
  cursor?: string

  /**
   * Decide whether a pointerdown starts a drag at all.
   *
   * Checked before anything else — **before the pointer is captured** — so
   * declining here leaves the whole gesture to whatever else is listening.
   * Deciding later would be too late: the capture has already been taken from
   * the element that was going to handle it.
   *
   * The use for it is a drag on a container that also holds draggable things
   * of its own, such as a rubber-band selection that must not begin on top of
   * one of the objects it would select.
   */
  shouldStart?: (event: PointerEvent) => boolean

  /**
   * Hide the pointer and read its movement directly, instead of following it
   * around the screen.
   *
   * A relative drag — a knob, a stepper — does not care where the pointer is,
   * only how far it moved, and letting it wander has two costs: the cursor
   * ends up far from what it is holding, and **the drag stops at the edge of
   * the screen**, where the operating system pins the pointer and the
   * coordinates stop changing. A fine drag reaches that edge quickly.
   *
   * **Not for a drag whose value is the position pointed at** — anything on
   * `elementMapping`. `clientX` / `clientY` freeze while the pointer is
   * locked, so there is no position left to read.
   *
   * The request needs a user gesture, which a pointerdown is, but it can still
   * be refused; the drag then carries on as an ordinary one. Read on
   * pointerdown, so `update()` reaches the next drag rather than the current.
   *
   * @default false
   */
  pointerLock?: boolean

  /**
   * Track every pointer that goes down on the element, rather than only the
   * first. Each one gets its own `onDragStart` / `onDrag` / `onDragEnd` and
   * carries its own totals; {@link DragState.pointerId} says which is which.
   *
   * Fixed for the lifetime of the instance: switching part way through a drag
   * has no meaning, so `update()` ignores it.
   *
   * @default false
   */
  multiPointer?: boolean

  onDragStart?: (state: DragState) => void
  onDrag?: (state: DragState) => void
  onDragEnd?: (state: DragState) => void
}

export interface DragInstance {
  /**
   * Replace the given options. Lets a wrapper feed fresh handlers in without
   * tearing down the listeners, which would abort a drag in progress.
   *
   * `multiPointer` is fixed for the lifetime of the instance and is ignored
   * here.
   */
  update: (options: DragOptions) => void
  destroy: () => void
}

/**
 * Applied to the element for the lifetime of the instance.
 *
 * `touch-action` stops touch dragging from scrolling the page. That alone makes
 * the browser treat a long press as the start of a text selection, so selection
 * and the iOS callout are suppressed here too.
 */
const MANAGED_STYLES = [
  ['touch-action', 'none'],
  ['user-select', 'none'],
  ['-webkit-user-select', 'none'],
  ['-webkit-touch-callout', 'none'],
] as const

type CaptureTarget = {
  requestPointerLock?: () => unknown
  setPointerCapture?: (pointerId: number) => void
  releasePointerCapture?: (pointerId: number) => void
  hasPointerCapture?: (pointerId: number) => boolean
}

/** What one pointer needs to report its own movement. */
type PointerState = {
  /** Where the listeners for this pointer live. */
  moveTarget: EventTarget
  startX: number
  startY: number
  lastX: number
  lastY: number
  /**
   * Where the travel stood when the pointer lock took effect, and how far it
   * has moved since. Screen coordinates stop changing under the lock, so from
   * that point the movement of each event is added up instead.
   *
   * The base is taken when the lock engages rather than on pointerdown: the
   * request is asynchronous, and whatever movement happened while it was in
   * flight was measured the ordinary way.
   */
  lockBaseX?: number
  lockBaseY?: number
  lockMoveX: number
  lockMoveY: number
  /** The most recent event, to end the drag with when the lock is lost. */
  lastEvent: PointerEvent
}

/**
 * Track a pointer drag on an element.
 *
 * Uses Pointer Events only, and pointer capture so that the drag keeps working
 * once the pointer leaves the element. For the lifetime of the instance the
 * element gets `touch-action: none` so that touch dragging does not scroll the
 * page, plus `user-select: none` so that a long press does not start a text
 * selection instead.
 *
 * One pointer at a time by default; see {@link DragOptions.multiPointer}.
 */
export function createDrag(
  element: Element,
  options: DragOptions = {},
): DragInstance {
  let opts = options
  const multiPointer = options.multiPointer ?? false
  const capture = element as CaptureTarget
  const style = (element as Partial<HTMLElement>).style

  const previousStyles = new Map<string, string>()
  if (style) {
    for (const [property, value] of MANAGED_STYLES) {
      previousStyles.set(property, style.getPropertyValue(property))
      style.setProperty(property, value)
    }
  }

  const pointers = new Map<number, PointerState>()
  /**
   * How many pointers each target carries. Adding the same listener twice is a
   * no-op and removing it once removes it for good, so a target is subscribed
   * to while at least one pointer is on it and no longer.
   */
  const targets = new Map<EventTarget, number>()
  let previousCursor: string | undefined
  /** The pointer that asked for the lock, while it is still down. */
  let lockedPointerId: number | null = null

  function state(
    event: PointerEvent,
    pointer: PointerState,
    deltaX: number,
    deltaY: number,
  ): DragState {
    return {
      x:
        pointer.lockBaseX !== undefined
          ? pointer.lockBaseX + pointer.lockMoveX
          : event.screenX - pointer.startX,
      y:
        pointer.lockBaseY !== undefined
          ? pointer.lockBaseY + pointer.lockMoveY
          : event.screenY - pointer.startY,
      deltaX,
      deltaY,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
      event,
    }
  }

  /**
   * `user-select: none` only makes the element's own text unselectable; the
   * browser still starts a selection on long press and grabs whatever text it
   * finds nearby. Cancelling the selection outright is what actually stops it.
   */
  function preventSelectStart(event: Event) {
    event.preventDefault()
  }

  function retainTarget(target: EventTarget) {
    const count = targets.get(target) ?? 0
    if (count === 0) {
      target.addEventListener('pointermove', handlePointerMove)
      target.addEventListener('pointerup', handlePointerUp)
      target.addEventListener('pointercancel', handlePointerUp)
    }
    targets.set(target, count + 1)
  }

  function releaseTarget(target: EventTarget) {
    const count = targets.get(target) ?? 0
    if (count > 1) {
      targets.set(target, count - 1)
      return
    }
    target.removeEventListener('pointermove', handlePointerMove)
    target.removeEventListener('pointerup', handlePointerUp)
    target.removeEventListener('pointercancel', handlePointerUp)
    targets.delete(target)
  }

  function handlePointerDown(event: Event) {
    const pointerEvent = event as PointerEvent
    const pointerId = pointerEvent.pointerId
    // Without multiPointer only one pointer drives the drag; ignore the rest.
    if (pointers.has(pointerId)) return
    if (!multiPointer && pointers.size > 0) return

    if (opts.shouldStart && !opts.shouldStart(pointerEvent)) return

    const isFirst = pointers.size === 0
    if (isFirst && opts.cursor && style) {
      previousCursor = style.cursor
      style.cursor = opts.cursor
    }

    capture.setPointerCapture?.(pointerId)
    // With pointer capture the element receives the rest of the gesture.
    // Without it (older engines, jsdom) fall back to the window.
    const moveTarget =
      capture.hasPointerCapture?.(pointerId) === true
        ? element
        : (globalThis.window ?? element)

    const pointer: PointerState = {
      moveTarget,
      startX: pointerEvent.screenX,
      startY: pointerEvent.screenY,
      lastX: pointerEvent.screenX,
      lastY: pointerEvent.screenY,
      lockMoveX: 0,
      lockMoveY: 0,
      lastEvent: pointerEvent,
    }
    pointers.set(pointerId, pointer)

    retainTarget(moveTarget)
    if (isFirst) {
      globalThis.document?.addEventListener('selectstart', preventSelectStart)
    }

    // One pointer can be locked, so the first one takes it.
    if (isFirst && opts.pointerLock) {
      lockedPointerId = pointerId
      globalThis.document?.addEventListener(
        'pointerlockchange',
        handleLockChange,
      )
      try {
        // Newer engines return a promise that rejects; older ones fire
        // `pointerlockerror` instead. Either way a refusal only means the drag
        // stays an ordinary one, so nothing here has to act on it.
        const request = capture.requestPointerLock?.() as
          Promise<void> | undefined
        request?.catch?.(() => {})
      } catch {
        // requestPointerLock threw synchronously; same story.
      }
    }

    opts.onDragStart?.(state(pointerEvent, pointer, 0, 0))
  }

  function handlePointerMove(event: Event) {
    const pointerEvent = event as PointerEvent
    const pointer = pointers.get(pointerEvent.pointerId)
    if (!pointer) return

    // Under the lock the screen position no longer moves, so the movement the
    // event reports is the only thing left to read.
    const locked = pointer.lockBaseX !== undefined
    const deltaX = locked
      ? (pointerEvent.movementX ?? 0)
      : pointerEvent.screenX - pointer.lastX
    const deltaY = locked
      ? (pointerEvent.movementY ?? 0)
      : pointerEvent.screenY - pointer.lastY

    // Movement below the threshold accumulates until it crosses it. Dropping it
    // instead would swallow a slow drag entirely: pointer coordinates are
    // fractional, so each event can move less than a pixel and never report.
    const threshold = opts.threshold ?? 0
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) return

    pointer.lastX = pointerEvent.screenX
    pointer.lastY = pointerEvent.screenY
    pointer.lastEvent = pointerEvent
    if (locked) {
      pointer.lockMoveX += deltaX
      pointer.lockMoveY += deltaY
    }

    opts.onDrag?.(state(pointerEvent, pointer, deltaX, deltaY))
  }

  function handleLockChange() {
    if (lockedPointerId === null) return
    const pointer = pointers.get(lockedPointerId)
    if (!pointer) return

    if (globalThis.document?.pointerLockElement === element) {
      // Engaged. Whatever moved while the request was in flight was measured
      // the ordinary way, so the travel so far becomes the base and the
      // per-event movement is added to it from here.
      pointer.lockBaseX = pointer.lastX - pointer.startX
      pointer.lockBaseY = pointer.lastY - pointer.startY
      pointer.lockMoveX = 0
      pointer.lockMoveY = 0
      return
    }

    // Lost without the pointer coming up: Esc, a tab switch, leaving
    // fullscreen. No pointerup is coming, so the drag ends here rather than
    // hanging on with a pointer nobody can see.
    if (pointer.lockBaseX === undefined) return
    const finalState = state(pointer.lastEvent, pointer, 0, 0)
    const pointerId = lockedPointerId
    stopTracking(pointerId)
    opts.onDragEnd?.(finalState)
  }

  function handlePointerUp(event: Event) {
    const pointerEvent = event as PointerEvent
    const pointer = pointers.get(pointerEvent.pointerId)
    if (!pointer) return

    const deltaX = pointerEvent.screenX - pointer.lastX
    const deltaY = pointerEvent.screenY - pointer.lastY
    const finalState = state(pointerEvent, pointer, deltaX, deltaY)

    stopTracking(pointerEvent.pointerId)
    opts.onDragEnd?.(finalState)
  }

  function stopTracking(pointerId: number) {
    const pointer = pointers.get(pointerId)
    if (!pointer) return

    capture.releasePointerCapture?.(pointerId)
    releaseTarget(pointer.moveTarget)
    pointers.delete(pointerId)

    if (lockedPointerId === pointerId) {
      lockedPointerId = null
      const document = globalThis.document
      document?.removeEventListener('pointerlockchange', handleLockChange)
      // Already gone when the lock is what ended the drag.
      if (document?.pointerLockElement === element) document.exitPointerLock?.()
    }

    if (pointers.size > 0) return

    globalThis.document?.removeEventListener('selectstart', preventSelectStart)
    if (previousCursor !== undefined && style) {
      style.cursor = previousCursor
      previousCursor = undefined
    }
  }

  element.addEventListener('pointerdown', handlePointerDown)

  return {
    update: (next) => {
      opts = { ...opts, ...next, multiPointer }
    },
    destroy: () => {
      for (const pointerId of [...pointers.keys()]) stopTracking(pointerId)
      element.removeEventListener('pointerdown', handlePointerDown)
      if (style) {
        for (const [property] of MANAGED_STYLES) {
          const previous = previousStyles.get(property)
          if (previous) {
            style.setProperty(property, previous)
          } else {
            style.removeProperty(property)
          }
        }
      }
    },
  }
}
