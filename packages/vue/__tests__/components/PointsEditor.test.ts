import { fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, h, nextTick, reactive } from 'vue'

import { type PointPosition } from '@tremolo-ui/dom'

import {
  PointsEditor,
  PointsEditorContainer,
  PointsEditorPoint,
  PointsEditorSelectionBox,
} from '../../src'
import { pointerEvent, withPointerCapture } from '../helpers'

async function setup(
  props: Record<string, unknown> = {},
  pointProps: Record<string, unknown> = {},
) {
  const onChange = vi.fn()
  const points = reactive<Record<string, PointPosition>>({
    a: { x: 0.2, y: 0.5 },
    b: { x: 0.6, y: 0.5 },
  })
  render(
    defineComponent({
      setup: () => () =>
        h(PointsEditor, props, () =>
          h(PointsEditorContainer, { 'data-testid': 'container' }, () => [
            ...Object.keys(points).map((id) =>
              h(PointsEditorPoint, {
                key: id,
                id,
                modelValue: points[id],
                'onUpdate:modelValue': (v: PointPosition) => {
                  points[id] = v
                  onChange(id, v)
                },
                'data-testid': `point-${id}`,
                ariaLabel: { x: `${id} x`, y: `${id} y` },
                ...pointProps,
              }),
            ),
            h(PointsEditorSelectionBox, { 'data-testid': 'box' }),
          ]),
        ),
    }),
  )
  await nextTick()
  const container = screen.getByTestId('container')
  const a = screen.getByTestId('point-a')
  const b = screen.getByTestId('point-b')
  container.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
    }) as DOMRect
  for (const element of [container, a, b]) withPointerCapture(element)
  return { container, a, b, onChange }
}

describe('PointsEditor', () => {
  test('a point is placed by its value, with an input per axis', async () => {
    const { a } = await setup()
    expect(a.style.left).toBe('20%')
    expect(screen.getByRole('slider', { name: 'a y' })).toHaveAttribute(
      'aria-orientation',
      'vertical',
    )
  })

  test('dragging a point moves it by the pointer movement', async () => {
    const { a, onChange } = await setup()
    a.dispatchEvent(pointerEvent('pointerdown', { clientX: 40, clientY: 50 }))
    a.dispatchEvent(pointerEvent('pointermove', { clientX: 60, clientY: 40 }))
    await nextTick()
    expect(onChange).toHaveBeenLastCalledWith('a', { x: 0.3, y: 0.4 })
    expect(a).toHaveAttribute('data-dragging', '')
  })

  test('arrow keys move the focused point', async () => {
    const { a, onChange } = await setup()
    await fireEvent.keyDown(a, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith('a', { x: 0.2, y: 0.49 })
  })

  test('a keydown of your own runs alongside the move', async () => {
    const onKeydown = vi.fn()
    const { a, onChange } = await setup({}, { onKeydown })
    await fireEvent.keyDown(a, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith('a', { x: 0.2, y: 0.49 })
    expect(onKeydown).toHaveBeenCalledTimes(1)
  })

  test('with selection, a selected group moves as one', async () => {
    const { a, onChange } = await setup({
      selectable: true,
      selection: ['a', 'b'],
    })
    await fireEvent.keyDown(a, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('a', { x: 0.21, y: 0.5 })
    expect(onChange).toHaveBeenCalledWith('b', { x: 0.61, y: 0.5 })
    expect(a).toHaveAttribute('data-selected', '')
  })

  test('a drag on empty space draws a box and selects what it covers', async () => {
    const { container, a, b } = await setup({ selectable: true })
    container.dispatchEvent(
      pointerEvent('pointerdown', { clientX: 20, clientY: 40 }),
    )
    container.dispatchEvent(
      pointerEvent('pointermove', { clientX: 60, clientY: 60 }),
    )
    await nextTick()
    expect(screen.getByTestId('box')).toBeInTheDocument()
    expect(a).toHaveAttribute('data-selected', '')
    expect(b).not.toHaveAttribute('data-selected')
    container.dispatchEvent(
      pointerEvent('pointerup', { clientX: 60, clientY: 60 }),
    )
    await nextTick()
    expect(screen.queryByTestId('box')).toBeNull()
  })
})
