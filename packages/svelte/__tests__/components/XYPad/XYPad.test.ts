import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'

import { pointerEvent, withPointerCapture } from '../../helpers'

import XYPadFixture from './XYPadFixture.svelte'

function setup(props: Record<string, unknown> = {}) {
  const onChange = vi.fn()
  render(XYPadFixture, { props: { onChange, ...props } })
  const root = screen.getByTestId('root')
  const area = screen.getByTestId('area')
  const [x, y] = screen.getAllByRole('slider')
  withPointerCapture(root)
  area.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
    }) as DOMRect
  return { root, area, x, y, onChange }
}

describe('XYPad', () => {
  test('one range input per axis, each with its own name', () => {
    const { x, y } = setup()
    expect(x).toHaveAttribute('aria-label', 'Cutoff')
    expect(y).toHaveAttribute('aria-label', 'Resonance')
    expect(y).toHaveAttribute('aria-orientation', 'vertical')
  })

  test('the thumb is placed by the value, y growing downwards', () => {
    setup({ value: [25, 10] })
    const thumb = screen.getByTestId('thumb')
    expect(thumb.style.left).toBe('25%')
    expect(thumb.style.top).toBe('10%')
  })

  test('the key picks the axis; up moves y towards the top', async () => {
    const { root, onChange } = setup()
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith([51, 50])
    await fireEvent.keyDown(root, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith([51, 49])
  })

  test('reverse flips an axis for the keys', async () => {
    const { root, onChange } = setup({ reverse: [false, true] })
    await fireEvent.keyDown(root, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith([50, 51])
  })

  test('shift+wheel moves x', async () => {
    const { root, x, onChange } = setup()
    x.focus()
    await fireEvent.wheel(root, { deltaX: 100, shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith([51, 50])
  })

  test('pressing the area jumps the value there', async () => {
    const { root, x, onChange } = setup()
    root.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 50, clientY: 150 }),
    )
    await tick()
    expect(onChange).toHaveBeenLastCalledWith([25, 75])
    expect(document.activeElement).toBe(x)
  })

  test('an input changes only its own axis', async () => {
    const { y, onChange } = setup()
    await fireEvent.input(y, { target: { value: '80' } })
    expect(onChange).toHaveBeenLastCalledWith([50, 80])
  })

  test('disabled blocks every input', async () => {
    const { root, x, onChange } = setup({ disabled: true })
    expect(x).toBeDisabled()
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    root.dispatchEvent(pointerEvent('pointerdown', { clientX: 50 }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
