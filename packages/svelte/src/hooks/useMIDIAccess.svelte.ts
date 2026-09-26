import {
  createMIDIAccess,
  type MIDIAccessInstance,
  type MIDIAccessOptions,
  type MIDIAccessState,
} from '@tremolo-ui/dom'

const INITIAL_STATE: MIDIAccessState = {
  midiAccess: null,
  error: null,
  inputs: [],
}

/**
 * Request MIDI access in the browser. Call it while a component is being
 * initialised: the access is created when the component mounts and let go
 * when it is destroyed.
 *
 * The returned object is reactive: `midiAccess`, `error` and `inputs` update
 * as access is granted and devices come and go.
 *
 * @param requestOnMount ask for access as soon as the component mounts. Leave
 * it off to ask from a click instead, so that opening a page does not bring
 * up a permission prompt. Pass a getter to ask once it turns true later.
 *
 * @example
 * const midi = useMIDIAccess(false)
 * // <button onclick={() => midi.request()}>Connect</button>
 * // {#each midi.inputs as input}{input.name}{/each}
 */
export function useMIDIAccess(
  requestOnMount: boolean | (() => boolean) = true,
) {
  let state = $state.raw<MIDIAccessState>(INITIAL_STATE)
  let instance: MIDIAccessInstance | null = null

  $effect(() => {
    const current = createMIDIAccess()
    instance = current
    state = current.getState()
    const unsubscribe = current.subscribe(() => {
      state = current.getState()
    })
    return () => {
      unsubscribe()
      current.destroy()
      instance = null
      state = INITIAL_STATE
    }
  })

  $effect(() => {
    const request =
      typeof requestOnMount === 'function' ? requestOnMount() : requestOnMount
    if (request) instance?.request()
  })

  return {
    get midiAccess() {
      return state.midiAccess
    },
    get error() {
      return state.error
    },
    get inputs() {
      return state.inputs
    },
    /**
     * Ask for access. Takes `{ sysex: true }` when the app needs system
     * exclusive messages, which browsers treat as a separate permission.
     */
    request: (options?: MIDIAccessOptions) => instance?.request(options),
  }
}
