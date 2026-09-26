import { computed, onScopeDispose, shallowRef } from 'vue'

import {
  createMIDIAccess,
  type MIDIAccessOptions,
  type MIDIAccessState,
} from '@tremolo-ui/dom'

/**
 * Request MIDI access in the browser. Call it during `setup`.
 *
 * `state` holds the access, the error and the connected inputs, and follows
 * devices as they are plugged in and unplugged.
 *
 * @param requestOnMount ask for access at once. Leave it off to ask from a
 * click instead, so that opening a page does not bring up a permission
 * prompt.
 */
export function useMIDIAccess(requestOnMount = true) {
  const instance = createMIDIAccess()
  const state = shallowRef<MIDIAccessState>(instance.getState())
  const unsubscribe = instance.subscribe(() => {
    state.value = instance.getState()
  })
  if (requestOnMount) instance.request()
  onScopeDispose(() => {
    unsubscribe()
    instance.destroy()
  })
  return {
    // Read-only, and without wrapping MIDIAccess in a proxy.
    state: computed(() => state.value),
    /**
     * Ask for access. Takes `{ sysex: true }` when the app needs system
     * exclusive messages, which browsers treat as a separate permission.
     */
    request: (options?: MIDIAccessOptions) => instance.request(options),
  }
}
