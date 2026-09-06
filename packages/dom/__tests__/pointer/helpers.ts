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
    movementX?: number
    movementY?: number
    shiftKey?: boolean
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

/**
 * jsdom has no Pointer Lock API, so it is faked: the element takes the lock
 * when asked and gives it back on exit, firing `pointerlockchange` both ways
 * as a browser would.
 *
 * @returns how many times the lock was asked for, and a way to drop it from
 * outside the drag — Esc, a tab switch, leaving fullscreen.
 */
export function withPointerLock(element: Element) {
  const state = { requests: 0 }

  const set = (value: Element | null) => {
    Object.defineProperty(document, 'pointerLockElement', {
      value,
      configurable: true,
    })
    document.dispatchEvent(new Event('pointerlockchange'))
  }

  Object.assign(element, {
    requestPointerLock: () => {
      state.requests += 1
      set(element)
    },
  })
  Object.assign(document, { exitPointerLock: () => set(null) })

  return {
    state,
    /** The lock going away without the drag asking, as Esc does. */
    lose: () => set(null),
  }
}
