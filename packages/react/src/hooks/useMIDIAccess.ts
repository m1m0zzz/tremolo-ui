import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { createMIDIAccess } from '@tremolo-ui/dom'

export {
  NOT_SUPPORTED,
  PERMISSION_DENIED,
  UNAVAILABLE,
  type MIDIAccessError,
  type MIDIAccessOptions,
} from '@tremolo-ui/dom'

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
  const instance = useMemo(() => createMIDIAccess(), [])

  const { midiAccess, error, inputs } = useSyncExternalStore(
    instance.subscribe,
    instance.getState,
    instance.getServerState,
  )

  useEffect(() => {
    if (requestOnMount) instance.request()
  }, [instance, requestOnMount])

  useEffect(() => {
    return () => instance.destroy()
  }, [instance])

  return { request: instance.request, midiAccess, error, inputs }
}
