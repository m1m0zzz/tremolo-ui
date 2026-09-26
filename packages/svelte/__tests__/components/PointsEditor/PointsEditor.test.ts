import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'

import { pointerEvent, withPointerCapture } from '../../helpers'

import PointsEditorFixture from './PointsEditorFixture.svelte'

const RECT = {
  left: 0,
  top: 0,
  right: 200,
  bottom: 100,
  width: 200,
  height: 100,
} as DOMRect

function setup(props: Record<string, unknown> = {}) {
  const onChange = vi.fn()
  render(PointsEditorFixture, { props: { onChange, ...props } })
  const container = screen.getByTestId('container')
  const a = screen.getByTestId('point-a')
  const b = screen.getByTestId('point-b')
  container.getBoundingClientRect = () => RECT
  for (const element of [container, a, b]) withPointerCapture(element)
  return { container, a, b, onChange }
}

describe('PointsEditor', () => {
  test('a point is placed by its value, with an input per axis', () => {
    const { a } = setup()
    expect(a.style.left).toBe('20%')
    expect(a.style.top).toBe('50%')
    expect(screen.getByRole('slider', { name: 'a y' })).toHaveAttribute(
      'aria-orientation',
      'vertical',
    )
  })

  test('dragging a point moves it by the pointer movement', async () => {
    const { a, onChange } = setup()
    a.dispatchEvent(pointerEvent('pointerdown', { clientX: 40, clientY: 50 }))
    a.dispatchEvent(pointerEvent('pointermove', { clientX: 60, clientY: 40 }))
    await tick()
    expect(onChange).toHaveBeenLastCalledWith('a', { x: 0.3, y: 0.4 })
    expect(a).toHaveAttribute('data-dragging', '')
  })

  test('arrow keys move the focused point', async () => {
    const { a, onChange } = setup()
    await fireEvent.keyDown(a, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith('a', { x: 0.2, y: 0.49 })
  })

  test('with selection, a selected group moves as one', async () => {
    const { a, onChange } = setup({ selectable: true, selection: ['a', 'b'] })
    await fireEvent.keyDown(a, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('a', { x: 0.21, y: 0.5 })
    expect(onChange).toHaveBeenCalledWith('b', { x: 0.61, y: 0.5 })
    expect(a).toHaveAttribute('data-selected', '')
  })

  test('a press selects the point it lands on', async () => {
    const { a, b } = setup({ selectable: true })
    b.dispatchEvent(pointerEvent('pointerdown', { clientX: 120, clientY: 50 }))
    b.dispatchEvent(pointerEvent('pointermove', { clientX: 121, clientY: 50 }))
    await tick()
    expect(b).toHaveAttribute('data-selected', '')
    expect(a).not.toHaveAttribute('data-selected')
  })

  test('a drag on empty space draws a box and selects what it covers', async () => {
    const { container, a, b } = setup({ selectable: true })
    container.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 20, clientY: 40 }),
    )
    container.dispatchEvent(
      pointerEvent('pointermove', { clientX: 60, clientY: 60 }),
    )
    await tick()
    expect(screen.getByTestId('box')).toBeInTheDocument()
    expect(a).toHaveAttribute('data-selected', '')
    expect(b).not.toHaveAttribute('data-selected')
    container.dispatchEvent(
      pointerEvent('pointerup', { clientX: 60, clientY: 60 }),
    )
    await tick()
    expect(screen.queryByTestId('box')).toBeNull()
  })

  test('without selection there is no selection box', async () => {
    const { container } = setup()
    container.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 20, clientY: 40 }),
    )
    container.dispatchEvent(
      pointerEvent('pointermove', { clientX: 60, clientY: 60 }),
    )
    await tick()
    expect(screen.queryByTestId('box')).toBeNull()
  })
})
