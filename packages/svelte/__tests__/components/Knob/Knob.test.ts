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

  test('a double click restores the default value', async () => {
    const { knob, onChange } = setup({ defaultValue: 20 })
    await fireEvent.dblClick(knob)
    expect(onChange).toHaveBeenLastCalledWith(20)
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
