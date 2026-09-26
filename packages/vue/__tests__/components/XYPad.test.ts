import { fireEvent, screen } from '@testing-library/vue'
import { h, nextTick } from 'vue'

import { XYPad, XYPadArea, XYPadThumb } from '../../src'
import { pointerEvent, withPointerCapture } from '../helpers'

import { renderWithModel } from './render'

async function setup(props: Record<string, unknown> = {}) {
  const { onChange } = await renderWithModel(
    XYPad,
    (props.modelValue as [number, number]) ?? [50, 50],
    { min: 0, max: 100, 'data-testid': 'root', ...props },
    () =>
      h(XYPadArea, { 'data-testid': 'area' }, () =>
        h(XYPadThumb, {
          'data-testid': 'thumb',
          'aria-label': ['Cutoff', 'Resonance'],
        }),
      ),
  )
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
  return { root, x, y, onChange }
}

describe('XYPad', () => {
  test('one range input per axis, each with its own name', async () => {
    const { x, y } = await setup()
    expect(x).toHaveAttribute('aria-label', 'Cutoff')
    expect(y).toHaveAttribute('aria-label', 'Resonance')
  })

  test('the key picks the axis; up moves y towards the top', async () => {
    const { root, onChange } = await setup()
    await fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith([51, 50])
    await fireEvent.keyDown(root, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith([51, 49])
  })

  test('shift+wheel moves x', async () => {
    const { root, x, onChange } = await setup()
    x.focus()
    await fireEvent.wheel(root, { deltaX: 100, shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith([51, 50])
  })

  test('pressing the area jumps the value there', async () => {
    const { root, x, onChange } = await setup()
    root.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 50, clientY: 150 }),
    )
    await nextTick()
    expect(onChange).toHaveBeenLastCalledWith([25, 75])
    expect(document.activeElement).toBe(x)
  })

  test('an input changes only its own axis', async () => {
    const { y, onChange } = await setup()
    await fireEvent.update(y, '80')
    expect(onChange).toHaveBeenLastCalledWith([50, 80])
  })
})
