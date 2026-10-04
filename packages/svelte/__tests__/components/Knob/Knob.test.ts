import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'

import { Knob } from '../../../src/index.js'
import { pointerEvent, withPointerCapture } from '../../helpers'

import KnobFixture from './KnobFixture.svelte'

function setup(props: Record<string, unknown> = {}) {
  const onChange = vi.fn()
  render(KnobFixture, { props: { onChange, ...props } })
  const knob = screen.getByTestId('knob')
  withPointerCapture(knob)
  return { knob, onChange }
}

describe('Knob', () => {
  test('renders a slider with the value and state as attributes', () => {
    const { knob } = setup({ readonly: true })
    expect(knob).toHaveAttribute('role', 'slider')
    expect(knob).toHaveAttribute('aria-valuenow', '50')
    expect(knob).toHaveAttribute('tabindex', '0')
    expect(knob).toHaveAttribute('data-readonly', '')
    expect(knob).not.toHaveAttribute('data-disabled')
  })

  test('arrow keys move the value, shift moves it off the step', async () => {
    const { knob, onChange } = setup()
    await fireEvent.keyDown(knob, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(51)
    await fireEvent.keyDown(knob, { key: 'ArrowLeft', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(50.9)
    expect(knob).toHaveAttribute('aria-valuenow', '50.9')
  })

  test('the wheel acts only while the knob has focus', async () => {
    const { knob, onChange } = setup()
    await fireEvent.wheel(knob, { deltaY: -100 })
    expect(onChange).not.toHaveBeenCalled()
    knob.focus()
    await fireEvent.wheel(knob, { deltaY: -100 })
    expect(onChange).toHaveBeenLastCalledWith(51)
  })

  test('a sideways scroll is left to the page', () => {
    const { knob, onChange } = setup()
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
    const { knob, onChange } = setup()
    knob.dispatchEvent(pointerEvent('pointerdown', { screenY: 100 }))
    knob.dispatchEvent(pointerEvent('pointermove', { screenY: 90 }))
    await tick()
    expect(onChange).toHaveBeenLastCalledWith(60)
    expect(knob).toHaveAttribute('data-dragging', '')
    knob.dispatchEvent(pointerEvent('pointerup', { screenY: 90 }))
    await tick()
    expect(knob).not.toHaveAttribute('data-dragging')
  })

  test('a double click restores resetValue', async () => {
    const { knob, onChange } = setup({ resetValue: 20 })
    await fireEvent.dblClick(knob)
    expect(onChange).toHaveBeenLastCalledWith(20)
  })

  test('resetValue defaults to startValue', async () => {
    const { knob, onChange } = setup({ min: -50, max: 50, startValue: 0 })
    await fireEvent.dblClick(knob)
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  test('resetValue null turns the double click off', async () => {
    const { knob, onChange } = setup({ resetValue: null })
    await fireEvent.dblClick(knob)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('disabled blocks every input and leaves the tab order', async () => {
    const { knob, onChange } = setup({ disabled: true })
    expect(knob).toHaveAttribute('tabindex', '-1')
    expect(knob).toHaveAttribute('data-disabled', '')
    await fireEvent.keyDown(knob, { key: 'ArrowUp' })
    await fireEvent.dblClick(knob)
    knob.dispatchEvent(pointerEvent('pointerdown', { screenY: 100 }))
    knob.dispatchEvent(pointerEvent('pointermove', { screenY: 90 }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('size sets --knob-size, with a unit for a number', () => {
    const { knob } = setup({ size: 48 })
    expect(knob.style.getPropertyValue('--knob-size')).toBe('48px')
  })

  test('startValue in the middle draws the inactive arc on both sides', () => {
    setup({ startValue: 50 })
    expect(screen.getAllByTestId('inactive')).toHaveLength(2)
  })

  test('a part outside Knob.Root throws for the missing context', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => render(Knob.Thumb)).toThrow(/context/i)
    // It is outside Knob.SVGRoot as well, which is warned about first.
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Knob.Thumb has to be rendered inside'),
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
    const { knob, onChange } = setup({ onChangeStart, onChangeEnd })
    knob.dispatchEvent(pointerEvent('pointerdown', { screenY: 100 }))
    knob.dispatchEvent(pointerEvent('pointermove', { screenY: 90 }))
    knob.dispatchEvent(pointerEvent('pointerup', { screenY: 90 }))
    await tick()

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
    const { knob } = setup({ onChangeStart, onChangeEnd, changeEndDelay: 200 })
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
    const { knob, onChange } = setup({
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
