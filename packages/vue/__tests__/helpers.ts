/**
 * jsdom has no PointerEvent and no pointer capture, so both are faked here.
 */
export function pointerEvent(
  type: string,
  init: {
    pointerId?: number
    screenX?: number
    screenY?: number
    clientX?: number
    clientY?: number
    button?: number
    shiftKey?: boolean
  } = {},
) {
  const { pointerId = 1, button = 0, ...coords } = init
  const event = new MouseEvent(type, { bubbles: true, button })
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  for (const [key, value] of Object.entries(coords)) {
    Object.defineProperty(event, key, { value })
  }
  return event
}

/** Give an element working setPointerCapture / hasPointerCapture. */
export function withPointerCapture(element: Element) {
  const captured = new Set<number>()
  Object.assign(element, {
    setPointerCapture: (id: number) => captured.add(id),
    releasePointerCapture: (id: number) => captured.delete(id),
    hasPointerCapture: (id: number) => captured.has(id),
  })
  return captured
}
