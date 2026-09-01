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
  event: PointerEvent
}

export type DragOptions = {
  /**
   * Minimum movement in pixels before `onDrag` fires.
   * Prevents `onDrag` from firing on, for example, a double click.
   * Values below 1 are clamped to 1.
   *
   * @default 1
   */
  threshold?: number

  /**
   * CSS cursor to show while dragging. Applied to the element itself: pointer
   * capture keeps it in effect even once the pointer leaves the element, so
   * there is no need to touch the document.
   */
  cursor?: string

  onDragStart?: (state: DragState) => void
  onDrag?: (state: DragState) => void
  onDragEnd?: (state: DragState) => void
}

export interface DragInstance {
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
  setPointerCapture?: (pointerId: number) => void
  releasePointerCapture?: (pointerId: number) => void
  hasPointerCapture?: (pointerId: number) => boolean
}

/**
 * Track a pointer drag on an element.
 *
 * Uses Pointer Events only, and pointer capture so that the drag keeps working
 * once the pointer leaves the element. For the lifetime of the instance the
 * element gets `touch-action: none` so that touch dragging does not scroll the
 * page, plus `user-select: none` so that a long press does not start a text
 * selection instead.
 */
export function createDrag(
  element: Element,
  {
    threshold: _threshold = 1,
    cursor,
    onDragStart,
    onDrag,
    onDragEnd,
  }: DragOptions = {},
): DragInstance {
  const threshold = Math.max(_threshold, 1)
  const capture = element as CaptureTarget
  const style = (element as Partial<HTMLElement>).style

  const previousStyles = new Map<string, string>()
  if (style) {
    for (const [property, value] of MANAGED_STYLES) {
      previousStyles.set(property, style.getPropertyValue(property))
      style.setProperty(property, value)
    }
  }

  let pointerId: number | null = null
  /** Where the listeners for the current drag live. */
  let moveTarget: EventTarget | null = null
  let startX = 0
  let startY = 0
  let lastX = 0
  let lastY = 0
  let previousCursor: string | undefined

  function state(
    event: PointerEvent,
    deltaX: number,
    deltaY: number,
  ): DragState {
    return {
      x: event.screenX - startX,
      y: event.screenY - startY,
      deltaX,
      deltaY,
      clientX: event.clientX,
      clientY: event.clientY,
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

  function handlePointerDown(event: Event) {
    const pointerEvent = event as PointerEvent
    // Only one pointer drives the drag; ignore additional touches.
    if (pointerId !== null) return

    pointerId = pointerEvent.pointerId
    startX = lastX = pointerEvent.screenX
    startY = lastY = pointerEvent.screenY

    if (cursor && style) {
      previousCursor = style.cursor
      style.cursor = cursor
    }

    capture.setPointerCapture?.(pointerId)
    // With pointer capture the element receives the rest of the gesture.
    // Without it (older engines, jsdom) fall back to the window.
    moveTarget =
      capture.hasPointerCapture?.(pointerId) === true
        ? element
        : (globalThis.window ?? element)

    moveTarget.addEventListener('pointermove', handlePointerMove)
    moveTarget.addEventListener('pointerup', handlePointerUp)
    moveTarget.addEventListener('pointercancel', handlePointerUp)
    globalThis.document?.addEventListener('selectstart', preventSelectStart)

    onDragStart?.(state(pointerEvent, 0, 0))
  }

  function handlePointerMove(event: Event) {
    const pointerEvent = event as PointerEvent
    if (pointerEvent.pointerId !== pointerId) return

    const deltaX = pointerEvent.screenX - lastX
    const deltaY = pointerEvent.screenY - lastY
    lastX = pointerEvent.screenX
    lastY = pointerEvent.screenY

    // Movement below the threshold is dropped rather than accumulated.
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) return

    onDrag?.(state(pointerEvent, deltaX, deltaY))
  }

  function handlePointerUp(event: Event) {
    const pointerEvent = event as PointerEvent
    if (pointerEvent.pointerId !== pointerId) return

    const deltaX = pointerEvent.screenX - lastX
    const deltaY = pointerEvent.screenY - lastY
    const finalState = state(pointerEvent, deltaX, deltaY)

    stopTracking()
    onDragEnd?.(finalState)
  }

  function stopTracking() {
    if (pointerId === null) return
    capture.releasePointerCapture?.(pointerId)
    moveTarget?.removeEventListener('pointermove', handlePointerMove)
    moveTarget?.removeEventListener('pointerup', handlePointerUp)
    moveTarget?.removeEventListener('pointercancel', handlePointerUp)
    globalThis.document?.removeEventListener('selectstart', preventSelectStart)
    if (cursor && style) {
      style.cursor = previousCursor ?? ''
      previousCursor = undefined
    }
    moveTarget = null
    pointerId = null
  }

  element.addEventListener('pointerdown', handlePointerDown)

  return {
    destroy: () => {
      stopTracking()
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
