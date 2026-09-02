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
  } = {},
) {
  const { pointerId = 1, ...coords } = init
  const event = new MouseEvent(type, { bubbles: true })
  // MouseEventInit coerces the coordinates to integers, so they are defined
  // directly; a slow drag moves by fractions of a pixel.
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
