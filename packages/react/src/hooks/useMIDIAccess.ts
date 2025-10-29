import { useCallback, useEffect, useState } from 'react'

/** @private */
export const PERMISSION_DENIED = 'PERMISSION_DENIED'
/** @private */
export const NOT_SUPPORTED = 'NOT_SUPPORTED'

/** @private */
export type MIDIAccessError = typeof PERMISSION_DENIED | typeof NOT_SUPPORTED

/**
 * Hooks for requesting MIDI access in the browser. The first argument allows you to choose whether to request access on mount.
 * @category hooks
 */
export function useMIDIAccess(requestOnMount = true) {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null)
  const [error, setError] = useState<MIDIAccessError | null>(null)

  const request = useCallback(() => {
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess()
        .then((access) => {
          setMidiAccess(access)
          setError(null)
        })
        .catch(() => {
          setError(PERMISSION_DENIED)
        })
    } else {
      setError(NOT_SUPPORTED)
    }
  }, [])

  useEffect(() => {
    if (requestOnMount) request()
  }, [requestOnMount, request])

  return { request, midiAccess, error }
}
