export interface WheelInstance {
  destroy: () => void
}

/**
 * Listen to wheel events on an element.
 *
 * The listener is registered with `passive: false` so that the handler can call
 * `preventDefault()` to stop the page from scrolling.
 */
export function createWheel(
  element: Element,
  onWheel: (event: WheelEvent) => void,
): WheelInstance {
  const handler = (event: Event) => onWheel(event as WheelEvent)

  element.addEventListener('wheel', handler, { passive: false })

  return {
    destroy: () => {
      // Only `capture` matters when removing, and it is false here.
      element.removeEventListener('wheel', handler)
    },
  }
}
