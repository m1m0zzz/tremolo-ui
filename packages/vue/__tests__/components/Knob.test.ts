import { fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, h, nextTick, ref } from 'vue'

import {
  Knob,
  KnobActiveLine,
  KnobInactiveLine,
  KnobSVGRoot,
  KnobThumb,
} from '../../src'
import { pointerEvent, withPointerCapture } from '../helpers'

async function setup(props: Record<string, unknown> = {}) {
  const onChange = vi.fn()
  const Subject = defineComponent({
    setup() {
      const value = ref(50)
      return () =>
        h(
          Knob,
          {
            modelValue: value.value,
            'onUpdate:modelValue': (v: number) => {
              value.value = v
              onChange(v)
            },
            min: 0,
            max: 100,
            'data-testid': 'knob',
            ...props,
          },
          () =>
            h(KnobSVGRoot, null, () => [
              h(KnobInactiveLine, { 'data-testid': 'inactive' }),
              h(KnobActiveLine, { 'data-testid': 'active' }),
              h(KnobThumb),
            ]),
        )
    },
  })
  render(Subject)
  // The drag and the wheel attach once the element is mounted.
  await nextTick()
  const knob = screen.getByTestId('knob')
  withPointerCapture(knob)
  return { knob, onChange }
}

describe('Knob', () => {
  test('renders a slider with the value and state as attributes', async () => {
    const { knob } = await setup({ readonly: true })
    expect(knob).toHaveAttribute('role', 'slider')
    expect(knob).toHaveAttribute('aria-valuenow', '50')
    expect(knob).toHaveAttribute('data-readonly', '')
    expect(knob).not.toHaveAttribute('data-disabled')
  })

  test('arrow keys move the value, shift moves it off the step', async () => {
    const { knob, onChange } = await setup()
    await fireEvent.keyDown(knob, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(51)
    await fireEvent.keyDown(knob, { key: 'ArrowLeft', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(50.9)
    expect(knob).toHaveAttribute('aria-valuenow', '50.9')
  })

  test('the wheel acts only while the knob has focus', async () => {
    const { knob, onChange } = await setup()
    await fireEvent.wheel(knob, { deltaY: -100 })
    expect(onChange).not.toHaveBeenCalled()
    knob.focus()
    await fireEvent.wheel(knob, { deltaY: -100 })
    expect(onChange).toHaveBeenLastCalledWith(51)
  })

  test('a sideways scroll is left to the page', async () => {
    const { knob, onChange } = await setup()
    knob.focus()
    const event = new WheelEvent('wheel', {
      deltaX: 100,
      bubbles: true,
      cancelable: true,
    })
    knob.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('dragging up raises the value and marks the drag', async () => {
    const { knob, onChange } = await setup()
    knob.dispatchEvent(pointerEvent('pointerdown', { screenY: 100 }))
    knob.dispatchEvent(pointerEvent('pointermove', { screenY: 90 }))
    await nextTick()
    expect(onChange).toHaveBeenLastCalledWith(60)
    expect(knob).toHaveAttribute('data-dragging', '')
    knob.dispatchEvent(pointerEvent('pointerup', { screenY: 90 }))
    await nextTick()
    expect(knob).not.toHaveAttribute('data-dragging')
  })

  test('a double click restores resetValue', async () => {
    const { knob, onChange } = await setup({ resetValue: 20 })
    await fireEvent.dblClick(knob)
    expect(onChange).toHaveBeenLastCalledWith(20)
  })

  test('resetValue defaults to startValue', async () => {
    const { knob, onChange } = await setup({
      min: -50,
      max: 50,
      startValue: 0,
    })
    await fireEvent.dblClick(knob)
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  test('resetValue null turns the double click off', async () => {
    const { knob, onChange } = await setup({ resetValue: null })
    await fireEvent.dblClick(knob)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('disabled blocks every input and leaves the tab order', async () => {
    const { knob, onChange } = await setup({ disabled: true })
    expect(knob).toHaveAttribute('tabindex', '-1')
    await fireEvent.keyDown(knob, { key: 'ArrowUp' })
    await fireEvent.dblClick(knob)
    knob.dispatchEvent(pointerEvent('pointerdown', { screenY: 100 }))
    knob.dispatchEvent(pointerEvent('pointermove', { screenY: 90 }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('size sets --knob-size, with a unit for a number', async () => {
    const { knob } = await setup({ size: 48 })
    expect(knob.style.getPropertyValue('--knob-size')).toBe('48px')
  })

  test('startValue in the middle draws the inactive arc on both sides', async () => {
    await setup({ startValue: 50 })
    expect(screen.getAllByTestId('inactive')).toHaveLength(2)
  })

  test('a part outside KnobSVGRoot warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Subject = defineComponent({
      setup: () => () =>
        h(Knob, { modelValue: 0, min: 0, max: 1 }, () => h(KnobThumb)),
    })
    render(Subject)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'KnobThumb has to be rendered inside KnobSVGRoot',
      ),
    )
    warn.mockRestore()
  })
})

describe('Knob change gesture', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('a drag starts before its first value and ends after its last', async () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const { knob, onChange } = await setup({ onChangeStart, onChangeEnd })
    knob.dispatchEvent(pointerEvent('pointerdown', { screenY: 100 }))
    knob.dispatchEvent(pointerEvent('pointermove', { screenY: 90 }))
    knob.dispatchEvent(pointerEvent('pointerup', { screenY: 90 }))
    await nextTick()

    expect(onChangeStart).toHaveBeenCalledWith(50, 'pointer')
    expect(onChangeEnd).toHaveBeenCalledWith(60, 'pointer')
    expect(onChangeStart.mock.invocationCallOrder[0]).toBeLessThan(
      onChange.mock.invocationCallOrder[0],
    )
  })

  test('the arrow keys end changeEndDelay after the last press', async () => {
    vi.useFakeTimers()
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const { knob } = await setup({
      onChangeStart,
      onChangeEnd,
      changeEndDelay: 200,
    })
    await fireEvent.keyDown(knob, { key: 'ArrowUp' })
    await fireEvent.keyDown(knob, { key: 'ArrowUp' })
    expect(onChangeStart).toHaveBeenCalledTimes(1)
    expect(onChangeStart).toHaveBeenCalledWith(50, 'keyboard')

    vi.advanceTimersByTime(200)
    expect(onChangeEnd).toHaveBeenCalledWith(52, 'keyboard')
  })

  test('a double click brackets the reset', async () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const { knob, onChange } = await setup({
      resetValue: 20,
      onChangeStart,
      onChangeEnd,
    })
    await fireEvent.dblClick(knob)

    expect(onChangeStart).toHaveBeenCalledWith(50, 'doubleClick')
    expect(onChange).toHaveBeenCalledWith(20)
    expect(onChangeEnd).toHaveBeenCalledWith(20, 'doubleClick')
  })
})
