/** What a change of value was made with. */
export type ChangeSource = 'pointer' | 'wheel' | 'keyboard' | 'doubleClick'

export interface ChangeGestureOptions {
  /** Called before the first change of a gesture. */
  onStart?: (source: ChangeSource) => void
  /** Called after the last change of a gesture. */
  onEnd?: (source: ChangeSource) => void
  /**
   * How long after the last wheel notch or key press a gesture counts as
   * over, in milliseconds. Neither has an event that says it is done, so the
   * gesture ends when nothing more arrives for this long.
   *
   * @default 500
   */
  endDelay?: number
}

export interface ChangeGestureInstance {
  /**
   * Start a gesture that lasts until {@link end}, such as a drag. A gesture of
   * another kind in progress ends first.
   */
  hold: (source: ChangeSource) => void
  /**
   * One step of a gesture with no end of its own, such as a wheel notch:
   * starts one if none is in progress, and ends it `endDelay` after the last
   * step. While a held gesture is in progress the step belongs to it.
   */
  pulse: (source: ChangeSource) => void
  /**
   * A gesture that starts and ends around a single change, such as a reset:
   * `change` runs between the two.
   */
  instant: (source: ChangeSource, change: () => void) => void
  /** End the gesture in progress, if any. */
  end: () => void
  /** Whether a gesture is in progress. */
  active: () => boolean
  /** Replace the given options. A gesture in progress picks them up. */
  update: (options: Partial<ChangeGestureOptions>) => void
  /** End a gesture in progress, so that nothing is left touched. */
  destroy: () => void
}

/**
 * Track when a change of value starts and ends, whatever made it: a drag, the
 * wheel, the keys or a reset. A host that records automation needs both ends
 * to know when the control is touched.
 */
export function createChangeGesture(
  options: ChangeGestureOptions = {},
): ChangeGestureInstance {
  let opts = options
  let current: { source: ChangeSource; held: boolean } | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function end() {
    clearTimer()
    if (!current) return
    const { source } = current
    current = null
    opts.onEnd?.(source)
  }

  function start(source: ChangeSource, held: boolean) {
    current = { source, held }
    opts.onStart?.(source)
  }

  return {
    hold: (source) => {
      if (current?.held && current.source === source) return
      end()
      start(source, true)
    },
    pulse: (source) => {
      if (current?.held) return
      if (!current || current.source !== source) {
        end()
        start(source, false)
      }
      clearTimer()
      timer = setTimeout(end, opts.endDelay ?? 500)
    },
    instant: (source, change) => {
      end()
      start(source, false)
      change()
      end()
    },
    end,
    active: () => current !== null,
    update: (next) => {
      opts = { ...opts, ...next }
    },
    destroy: end,
  }
}
