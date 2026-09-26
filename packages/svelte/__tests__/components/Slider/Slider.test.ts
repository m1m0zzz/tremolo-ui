import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'

import { pointerEvent, withPointerCapture } from '../../helpers'

import SliderFixture from './SliderFixture.svelte'

function setup(props: Record<string, unknown> = {}) {
  const onChange = vi.fn()
  render(SliderFixture, { props: { onChange, ...props } })
  const root = screen.getByTestId('root')
  const track = screen.getByTestId('track')
  const input = screen.getByRole('slider')
  withPointerCapture(root)
  // jsdom lays nothing out, so the track is placed by hand: 200px wide.
  track.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
    }) as DOMRect
  return { root, track, input, onChange }
}

describe('Slider', () => {
  test('the range input carries the value and the label', () => {
    const { input } = setup()
    expect(input).toHaveAttribute('aria-label', 'Level')
    expect(input).toHaveValue('50')
    expect(input).toHaveAttribute('aria-orientation', 'horizontal')
  })

  test('every part says which way it runs, and the track the percent', () => {
    const { root, track } = setup({ vertical: true })
    expect(root).toHaveAttribute('data-orientation', 'vertical')
    expect(track).toHaveAttribute('data-orientation', 'vertical')
    // Vertical grows upwards, so 50 of 0..100 is 50% from the top.
    expect(track.style.getPropertyValue('--percent')).toBe('50%')
  })

  test('the thumb is placed by the value', () => {
    setup({ value: 25 })
    expect(screen.getByTestId('thumb').style.left).toBe('25%')
  })

  test('arrow keys move the value; reverse flips them', async () => {
    const { root, onChange } = setup({ reverse: true })
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(49)
  })

  test('pressing the track jumps the value there and focuses the input', async () => {
    const { root, input, onChange } = setup()
    root.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 150, clientY: 0 }),
    )
    await tick()
    expect(onChange).toHaveBeenLastCalledWith(75)
    expect(document.activeElement).toBe(input)
  })

  test('the wheel acts while the focus is inside', async () => {
    const { root, input, onChange } = setup()
    input.focus()
    await fireEvent.wheel(root, { deltaY: -100 })
    expect(onChange).toHaveBeenLastCalledWith(51)
  })

  test('a vertical slider leaves a sideways scroll to the page', () => {
    const { root, input, onChange } = setup({ vertical: true })
    input.focus()
    const event = new WheelEvent('wheel', {
      deltaX: 100,
      bubbles: true,
      cancelable: true,
    })
    root.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('assistive technology can set the value through the input', async () => {
    const { input, onChange } = setup()
    await fireEvent.input(input, { target: { value: '70' } })
    expect(onChange).toHaveBeenLastCalledWith(70)
  })

  test('disabled blocks the input and removes it from the tab order', async () => {
    const { root, input, onChange } = setup({ disabled: true })
    expect(input).toBeDisabled()
    expect(root).toHaveAttribute('data-disabled', '')
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    root.dispatchEvent(pointerEvent('pointerdown', { clientX: 150 }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('readonly keeps the value while leaving the input focusable', async () => {
    const { input, onChange } = setup({ readonly: true })
    expect(input).not.toBeDisabled()
    await fireEvent.input(input, { target: { value: '70' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('50')
  })

  test('marks are laid out from options', () => {
    setup({ marks: 25 })
    const marks = screen.getByTestId('marks')
    expect(marks.children).toHaveLength(5)
    expect([...marks.children].map((m) => m.textContent?.trim())).toEqual([
      '0',
      '25',
      '50',
      '75',
      '100',
    ])
  })
})
