import { fireEvent, screen } from '@testing-library/vue'
import { h, nextTick } from 'vue'

import { type MarksOptions } from '@tremolo-ui/dom'

import { Slider, SliderMarks, SliderThumb, SliderTrack } from '../../src'
import { pointerEvent, withPointerCapture } from '../helpers'

import { renderWithModel } from './render'

async function setup(
  props: Record<string, unknown> & { marks?: MarksOptions } = {},
) {
  const { marks, ...rest } = props
  const { onChange } = await renderWithModel(
    Slider,
    (rest.modelValue as number) ?? 50,
    { min: 0, max: 100, 'data-testid': 'root', ...rest },
    () => [
      h(SliderTrack, { 'data-testid': 'track' }, () =>
        h(SliderThumb, { 'data-testid': 'thumb', 'aria-label': 'Level' }),
      ),
      marks !== undefined
        ? h(SliderMarks, { options: marks, 'data-testid': 'marks' })
        : null,
    ],
  )
  const root = screen.getByTestId('root')
  const track = screen.getByTestId('track')
  const input = screen.getByRole('slider')
  withPointerCapture(root)
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
  test('the range input carries the value and the label', async () => {
    const { input } = await setup()
    expect(input).toHaveAttribute('aria-label', 'Level')
    expect(input).toHaveValue('50')
  })

  test('every part says which way it runs, and the track the percent', async () => {
    const { root, track } = await setup({ vertical: true })
    expect(root).toHaveAttribute('data-orientation', 'vertical')
    expect(track.style.getPropertyValue('--percent')).toBe('50%')
  })

  test('the thumb is placed by the value', async () => {
    await setup({ modelValue: 25 })
    expect(screen.getByTestId('thumb').style.left).toBe('25%')
  })

  test('arrow keys move the value; reverse flips them', async () => {
    const { root, onChange } = await setup({ reverse: true })
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(49)
  })

  test('pressing the track jumps the value there and focuses the input', async () => {
    const { root, input, onChange } = await setup()
    root.dispatchEvent(pointerEvent('pointerdown', { clientX: 150 }))
    await nextTick()
    expect(onChange).toHaveBeenLastCalledWith(75)
    expect(document.activeElement).toBe(input)
  })

  test('a vertical slider leaves a sideways scroll to the page', async () => {
    const { root, input, onChange } = await setup({ vertical: true })
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
    const { input, onChange } = await setup()
    await fireEvent.update(input, '70')
    expect(onChange).toHaveBeenLastCalledWith(70)
  })

  test('disabled blocks every input', async () => {
    const { root, input, onChange } = await setup({ disabled: true })
    expect(input).toBeDisabled()
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    root.dispatchEvent(pointerEvent('pointerdown', { clientX: 150 }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('marks are laid out from options', async () => {
    await setup({ marks: 25 })
    const marks = screen.getByTestId('marks')
    expect([...marks.children].map((m) => m.textContent)).toEqual([
      '0',
      '25',
      '50',
      '75',
      '100',
    ])
  })
})
