import { useEffect, useMemo, useSyncExternalStore } from 'react'

import {
  createMIDIAccess,
  type MIDIAccessInstance,
  type MIDIAccessOptions,
  type MIDIAccessState,
} from '@tremolo-ui/dom'

export {
  NOT_SUPPORTED,
  PERMISSION_DENIED,
  UNAVAILABLE,
  type MIDIAccessError,
  type MIDIAccessOptions,
} from '@tremolo-ui/dom'

const INITIAL_STATE: MIDIAccessState = {
  midiAccess: null,
  error: null,
  inputs: [],
}

function createMIDIAccessStore() {
  let instance: MIDIAccessInstance | null = null
  let unsubscribe: VoidFunction | null = null
  let state = INITIAL_STATE
  const listeners = new Set<VoidFunction>()

  function emit() {
    for (const listener of listeners) listener()
  }

  function connect() {
    const nextInstance = createMIDIAccess()
    instance = nextInstance
    state = nextInstance.getState()
    unsubscribe = nextInstance.subscribe(() => {
      state = nextInstance.getState()
      emit()
    })
    emit()
    return nextInstance
  }

  function disconnect(currentInstance: MIDIAccessInstance) {
    if (instance !== currentInstance) return

    unsubscribe?.()
    unsubscribe = null
    instance = null
    state = INITIAL_STATE
    currentInstance.destroy()
    emit()
  }

  function request(options?: MIDIAccessOptions) {
    instance?.request(options)
  }

  return {
    connect,
    disconnect,
    request,
    getState: () => state,
    getServerState: () => INITIAL_STATE,
    subscribe: (listener: VoidFunction) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/**
 * Hooks for requesting MIDI access in the browser. The first argument allows you to choose whether to request access on mount.
 *
 * `inputs` follows the devices: it changes as one is plugged in or unplugged,
 * so a list of devices needs no `statechange` listener of its own.
 *
 * `request` takes `{ sysex: true }` when the app needs system exclusive
 * messages. Browsers treat that as a separate, more sensitive permission, so
 * ask for it only when it is actually used.
 */
export function useMIDIAccess(requestOnMount = true) {
  const store = useMemo(() => createMIDIAccessStore(), [])

  const { midiAccess, error, inputs } = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getServerState,
  )

  useEffect(() => {
    const instance = store.connect()
    return () => store.disconnect(instance)
  }, [store])

  useEffect(() => {
    if (requestOnMount) store.request()
  }, [store, requestOnMount])

  return { request: store.request, midiAccess, error, inputs }
}
