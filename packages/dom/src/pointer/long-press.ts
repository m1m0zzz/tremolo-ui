export interface LongPressOptions {
  /** Called once on the press, then again every `interval` after `delay`. */
  onPress: () => void
  /**
   * How long the press has to be held before it starts repeating, in
   * milliseconds.
   *
   * @default 500
   */
  delay?: number
  /**
   * How often it repeats once it has started, in milliseconds.
   *
   * @default 40
   */
  interval?: number
}

export interface LongPressInstance {
  /**
   * Start a press, from a `pointerdown` or with no event at all. Only the
   * primary button starts one, and a press already in progress is left alone.
   */
  start: (event?: Pick<PointerEvent, 'button' | 'pointerId'>) => void
  /** End the press, as releasing the pointer would. */
  stop: () => void
  /** Replace the given options. The press in progress picks them up. */
  update: (options: Partial<LongPressOptions>) => void
  /** Whether a press is in progress. */
  pressed: () => boolean
  destroy: () => void
}

/**
 * Repeat an action while a pointer is held down: once on the press, then
 * again every `interval` after `delay` — the way a stepper button or a
 * key held on a keyboard behaves.
 *
 * The release is listened for on the window, not on the element: the
 * pointer may be let go anywhere. Only the pointer that started the press
 * ends it, so a second finger lifting elsewhere does not. The window losing
 * focus ends it too, since the release would never arrive.
 */
export function createLongPress(options: LongPressOptions): LongPressInstance {
  let opts = options
  let pointerId: number | null = null
  let active = false
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  /** Wait `wait`, fire, and keep going at `interval` from then on. */
  function schedule(wait: number) {
    timer = setTimeout(() => {
      opts.onPress()
      if (active) schedule(opts.interval ?? 40)
    }, wait)
  }

  function onPointerEnd(event: PointerEvent) {
    // Pointer events carry an id; a press started without one ends on any.
    if (pointerId !== null && event.pointerId !== pointerId) return
    stop()
  }

  function listen(add: boolean) {
    const target = globalThis.window
    if (!target) return
    const method = add ? 'addEventListener' : 'removeEventListener'
    target[method]('pointerup', onPointerEnd as EventListener)
    target[method]('pointercancel', onPointerEnd as EventListener)
    target[method]('blur', stop)
  }

  function stop() {
    if (!active) return
    active = false
    pointerId = null
    clearTimer()
    listen(false)
  }

  return {
    start: (event) => {
      if (active || (event && event.button !== 0)) return
      active = true
      pointerId = event?.pointerId ?? null
      listen(true)
      opts.onPress()
      // The action may have stopped the press itself.
      if (active) schedule(opts.delay ?? 500)
    },
    stop,
    update: (next) => {
      opts = { ...opts, ...next }
    },
    pressed: () => active,
    destroy: stop,
  }
}
