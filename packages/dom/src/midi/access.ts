/** @private */
export const PERMISSION_DENIED = 'PERMISSION_DENIED'
/** @private */
export const NOT_SUPPORTED = 'NOT_SUPPORTED'
/** @private */
export const UNAVAILABLE = 'UNAVAILABLE'

/** @private */
export type MIDIAccessError =
  typeof PERMISSION_DENIED | typeof NOT_SUPPORTED | typeof UNAVAILABLE

export type MIDIAccessOptions = {
  /**
   * Ask for system exclusive messages as well.
   *
   * Browsers treat this as a separate, more sensitive permission, so leave it
   * off unless the app actually reads or sends sysex.
   *
   * @default false
   */
  sysex?: boolean
}

export type MIDIAccessState = {
  readonly midiAccess: MIDIAccess | null
  readonly error: MIDIAccessError | null
  /**
   * The inputs currently connected, in the order MIDIAccess lists them.
   *
   * Kept up to date as devices are plugged in and unplugged, so a UI listing
   * the devices does not have to watch `statechange` itself.
   */
  readonly inputs: readonly MIDIInput[]
}

const INITIAL_STATE: MIDIAccessState = {
  midiAccess: null,
  error: null,
  inputs: [],
}

export interface MIDIAccessInstance {
  /** Request MIDI access. Safe to call more than once. */
  request: (options?: MIDIAccessOptions) => void
  getState: () => MIDIAccessState
  /** Snapshot for server side rendering. Always the initial state. */
  getServerState: () => MIDIAccessState
  /** @returns unsubscribe function */
  subscribe: (listener: () => void) => () => void
  destroy: () => void
}

/**
 * Which of our errors a rejected `requestMIDIAccess()` amounts to.
 *
 * The spec names the reasons, and they need telling apart: a user who said no
 * can say yes on a second ask, while a browser without the API never will.
 */
function toError(reason: unknown): MIDIAccessError {
  const name =
    typeof reason === 'object' && reason !== null && 'name' in reason
      ? String((reason as { name: unknown }).name)
      : ''

  if (name === 'SecurityError' || name === 'NotAllowedError') {
    return PERMISSION_DENIED
  }
  if (name === 'NotSupportedError' || name === 'TypeError') {
    return NOT_SUPPORTED
  }
  // AbortError, InvalidStateError, and anything a browser makes up.
  return UNAVAILABLE
}

/**
 * Request MIDI access in the browser.
 *
 * The returned instance holds the state and notifies subscribers when it changes,
 * so it can be consumed from any framework.
 */
export function createMIDIAccess(): MIDIAccessInstance {
  let state = INITIAL_STATE
  let destroyed = false
  let access: MIDIAccess | null = null
  const listeners = new Set<() => void>()

  function setState(next: MIDIAccessState) {
    state = next
    for (const listener of listeners) listener()
  }

  /**
   * A new array every time, so that `useSyncExternalStore` and its equivalents
   * see the change. The identity of the state object is what they compare.
   */
  function readInputs() {
    return access ? [...access.inputs.values()] : []
  }

  function handleStateChange() {
    if (destroyed || !access) return
    setState({ ...state, inputs: readInputs() })
  }

  function request(options: MIDIAccessOptions = {}) {
    if (destroyed) return
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      setState({ ...state, error: NOT_SUPPORTED })
      return
    }
    navigator
      .requestMIDIAccess({ sysex: options.sysex ?? false })
      .then((granted) => {
        if (destroyed) return
        access = granted
        granted.addEventListener('statechange', handleStateChange)
        setState({ midiAccess: granted, error: null, inputs: readInputs() })
      })
      .catch((reason: unknown) => {
        if (destroyed) return
        setState({ ...state, error: toError(reason) })
      })
  }

  return {
    request,
    getState: () => state,
    getServerState: () => INITIAL_STATE,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    destroy: () => {
      destroyed = true
      access?.removeEventListener('statechange', handleStateChange)
      access = null
      listeners.clear()
    },
  }
}
