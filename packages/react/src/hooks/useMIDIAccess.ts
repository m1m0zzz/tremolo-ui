import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { createMIDIAccess } from '@tremolo-ui/dom'

export {
  NOT_SUPPORTED,
  PERMISSION_DENIED,
  type MIDIAccessError,
} from '@tremolo-ui/dom'

/**
 * Hooks for requesting MIDI access in the browser. The first argument allows you to choose whether to request access on mount.
 */
export function useMIDIAccess(requestOnMount = true) {
  const instance = useMemo(() => createMIDIAccess(), [])

  const { midiAccess, error } = useSyncExternalStore(
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

  return { request: instance.request, midiAccess, error }
}
