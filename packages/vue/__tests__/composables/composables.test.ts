import { render } from '@testing-library/vue'
import {
  defineComponent,
  h,
  nextTick,
  ref,
  useTemplateRef,
  type ShallowRef,
} from 'vue'

import { relativeMapping } from '@tremolo-ui/dom'

import { useDrag } from '../../src/composables/useDrag'
import { useDragValue } from '../../src/composables/useDragValue'
import { useDropZone } from '../../src/composables/useDropZone'
import { useLongPress } from '../../src/composables/useLongPress'
import { useWheel } from '../../src/composables/useWheel'
import { pointerEvent, withPointerCapture } from '../helpers'

/** Mount a div that `setup` wires up, and hand it back. */
async function mount(
  setup: (el: Readonly<ShallowRef<HTMLDivElement | null>>) => void,
) {
  const Subject = defineComponent({
    setup() {
      const el = useTemplateRef<HTMLDivElement>('el')
      setup(el)
      return () => h('div', { ref: 'el', 'data-testid': 'el' })
    },
  })
  const view = render(Subject)
  await nextTick()
  const element = view.getByTestId('el')
  withPointerCapture(element)
  return { view, element }
}

test('useDrag reports the movement, following new options in place', async () => {
  const first = vi.fn()
  const second = vi.fn()
  const handler = ref(first)
  const { element } = await mount((el) =>
    useDrag(el, () => ({ onDrag: handler.value })),
  )
  element.dispatchEvent(pointerEvent('pointerdown', { screenX: 0 }))
  element.dispatchEvent(pointerEvent('pointermove', { screenX: 5 }))
  expect(first).toHaveBeenCalled()
  handler.value = second
  await nextTick()
  element.dispatchEvent(pointerEvent('pointermove', { screenX: 10 }))
  expect(second).toHaveBeenCalled()
})

test('useDragValue drives a value', async () => {
  let value = 50
  const { element } = await mount((el) =>
    useDragValue(el, {
      axis: { min: 0, max: 100 },
      mapping: relativeMapping({ pixelRange: 100 }),
      getValue: () => [value, value],
      onChange: ([x]) => {
        value = x
      },
    }),
  )
  element.dispatchEvent(pointerEvent('pointerdown', { screenX: 0 }))
  element.dispatchEvent(pointerEvent('pointermove', { screenX: 10 }))
  expect(value).toBe(60)
})

test('useWheel stops listening when the component goes', async () => {
  const onWheel = vi.fn()
  const { view, element } = await mount((el) => useWheel(el, onWheel))
  element.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
  expect(onWheel).toHaveBeenCalledTimes(1)
  view.unmount()
  element.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
  expect(onWheel).toHaveBeenCalledTimes(1)
})

test('useLongPress repeats while held', async () => {
  vi.useFakeTimers()
  const onPress = vi.fn()
  let start!: ReturnType<typeof useLongPress>
  await mount(() => {
    start = useLongPress({ onPress, delay: 100, interval: 20 })
  })
  start({ button: 0, pointerId: 1 })
  vi.advanceTimersByTime(140)
  expect(onPress).toHaveBeenCalledTimes(4)
  window.dispatchEvent(pointerEvent('pointerup'))
  vi.advanceTimersByTime(100)
  expect(onPress).toHaveBeenCalledTimes(4)
  vi.useRealTimers()
})

test('useDropZone reports a drag over it', async () => {
  let state!: ReturnType<typeof useDropZone>
  const { element } = await mount((el) => {
    state = useDropZone(el, { accept: 'audio/*' })
  })
  const event = new Event('dragenter', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: { types: ['Files'], items: [{ kind: 'file', type: 'audio/wav' }] },
  })
  element.dispatchEvent(event)
  expect(state.value).toEqual({ over: true, invalid: false })
})
