import {
  computed,
  onMounted,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'

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
 * @param requestOnMount ask for access once the component is mounted — never
 * during server rendering, where there is no MIDI to ask for. Leave it off to
 * ask from a click instead, so that opening a page does not bring up a
 * permission prompt. A ref or a getter asks once it turns true.
 */
export function useMIDIAccess(
  requestOnMount: MaybeRefOrGetter<boolean> = true,
) {
  const instance = createMIDIAccess()
  const state = shallowRef<MIDIAccessState>(instance.getState())
  const unsubscribe = instance.subscribe(() => {
    state.value = instance.getState()
  })
  onMounted(() => {
    watch(
      () => toValue(requestOnMount),
      (request) => {
        if (request) instance.request()
      },
      { immediate: true },
    )
  })
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
