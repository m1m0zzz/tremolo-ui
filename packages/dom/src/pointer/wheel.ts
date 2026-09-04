export interface WheelOptions {
  /**
   * Only report events while the focus is inside the element.
   *
   * A control that reacts to the wheel on hover alone takes the scroll away
   * from the page, so passing over one in a long form silently changes its
   * value. Requiring focus makes that an explicit act.
   *
   * The check is `contains`, not an identity test: the element that actually
   * takes focus is usually a descendant, such as a thumb or an `<input>`, and
   * a caller may have replaced it with markup of their own.
   *
   * @default false
   */
  requireFocus?: boolean
}

export interface WheelInstance {
  /** Replace the given options, keeping the listener in place. */
  update: (options: WheelOptions) => void
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
  options: WheelOptions = {},
): WheelInstance {
  let opts = options

  function hasFocus() {
    const active = element.ownerDocument?.activeElement
    return !!active && element.contains(active)
  }

  const handler = (event: Event) => {
    if (opts.requireFocus && !hasFocus()) return
    onWheel(event as WheelEvent)
  }

  element.addEventListener('wheel', handler, { passive: false })

  return {
    update: (next) => {
      opts = { ...opts, ...next }
    },
    destroy: () => {
      // Only `capture` matters when removing, and it is false here.
      element.removeEventListener('wheel', handler)
    },
  }
}
