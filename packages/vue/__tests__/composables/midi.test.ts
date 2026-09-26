import { render } from '@testing-library/vue'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { useMIDIAccess } from '../../src/composables/useMIDIAccess'
import { useMIDIInput } from '../../src/composables/useMIDIInput'

const original = navigator.requestMIDIAccess

afterEach(() => {
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: original,
    configurable: true,
    writable: true,
  })
})

function fakeAccess() {
  const listeners = new Set<(event: Event) => void>()
  const input = {
    name: 'keys',
    addEventListener: (_: string, fn: (event: Event) => void) =>
      listeners.add(fn),
    removeEventListener: (_: string, fn: (event: Event) => void) =>
      listeners.delete(fn),
  }
  const access = {
    inputs: new Map([['0', input]]),
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as MIDIAccess
  const send = (data: number[]) => {
    const event = Object.assign(new Event('midimessage'), {
      data: new Uint8Array(data),
    })
    for (const fn of [...listeners]) fn(event)
  }
  return { access, send, listeners }
}

test('useMIDIAccess requests access and follows the state', async () => {
  const { access } = fakeAccess()
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: vi.fn(async () => access),
    configurable: true,
    writable: true,
  })
  let midi!: ReturnType<typeof useMIDIAccess>
  const view = render(
    defineComponent({
      setup() {
        midi = useMIDIAccess()
        return () => h('div')
      },
    }),
  )
  await vi.waitFor(() => expect(midi.state.value.midiAccess).toBe(access))
  expect(midi.state.value.inputs.map((i) => i.name)).toEqual(['keys'])
  view.unmount()
})

test('useMIDIAccess does not ask while rendering on the server', async () => {
  const request = vi.fn(async () => fakeAccess().access)
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: request,
    configurable: true,
    writable: true,
  })
  const html = await renderToString(
    createSSRApp(
      defineComponent({
        setup() {
          const midi = useMIDIAccess()
          return () => h('div', String(midi.state.value.error))
        },
      }),
    ),
  )
  expect(html).toBe('<div>null</div>')
  expect(request).not.toHaveBeenCalled()
})

test('useMIDIAccess asks once a ref turns true', async () => {
  const { access } = fakeAccess()
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: vi.fn(async () => access),
    configurable: true,
    writable: true,
  })
  const auto = ref(false)
  let midi!: ReturnType<typeof useMIDIAccess>
  const view = render(
    defineComponent({
      setup() {
        midi = useMIDIAccess(auto)
        return () => h('div')
      },
    }),
  )
  await nextTick()
  expect(navigator.requestMIDIAccess).not.toHaveBeenCalled()
  auto.value = true
  await vi.waitFor(() => expect(midi.state.value.midiAccess).toBe(access))
  view.unmount()
})

test('useMIDIInput decodes messages and swaps handlers in place', async () => {
  const { access, send, listeners } = fakeAccess()
  const first = vi.fn()
  const second = vi.fn()
  const handler = ref(first)
  const view = render(
    defineComponent({
      setup() {
        useMIDIInput(access, () => ({ onNoteOnEvent: handler.value }))
        return () => h('div')
      },
    }),
  )
  send([0x90, 60, 100])
  expect(first).toHaveBeenCalledWith(60, 100, 0)
  handler.value = second
  await nextTick()
  send([0x90, 62, 90])
  expect(second).toHaveBeenCalledWith(62, 90, 0)
  expect(listeners.size).toBe(1)
  view.unmount()
  expect(listeners.size).toBe(0)
})
