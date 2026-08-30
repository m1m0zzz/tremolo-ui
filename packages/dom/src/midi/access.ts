/** @private */
export const PERMISSION_DENIED = 'PERMISSION_DENIED'
/** @private */
export const NOT_SUPPORTED = 'NOT_SUPPORTED'

/** @private */
export type MIDIAccessError = typeof PERMISSION_DENIED | typeof NOT_SUPPORTED

export type MIDIAccessState = {
  readonly midiAccess: MIDIAccess | null
  readonly error: MIDIAccessError | null
}

const INITIAL_STATE: MIDIAccessState = {
  midiAccess: null,
  error: null,
}

export interface MIDIAccessInstance {
  /** Request MIDI access. Safe to call more than once. */
  request: () => void
  getState: () => MIDIAccessState
  /** Snapshot for server side rendering. Always the initial state. */
  getServerState: () => MIDIAccessState
  /** @returns unsubscribe function */
  subscribe: (listener: () => void) => () => void
  destroy: () => void
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
  const listeners = new Set<() => void>()

  function setState(next: MIDIAccessState) {
    state = next
    for (const listener of listeners) listener()
  }

  function request() {
    if (destroyed) return
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      setState({ ...state, error: NOT_SUPPORTED })
      return
    }
    navigator
      .requestMIDIAccess()
      .then((access) => {
        if (destroyed) return
        setState({ midiAccess: access, error: null })
      })
      .catch(() => {
        if (destroyed) return
        setState({ ...state, error: PERMISSION_DENIED })
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
      listeners.clear()
    },
  }
}
