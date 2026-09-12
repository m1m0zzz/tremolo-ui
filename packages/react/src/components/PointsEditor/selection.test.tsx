import { act, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { PointBaseType, PointsEditor } from '.'

/** jsdom has no PointerEvent and no pointer capture, so both are faked here. */
function pointerEvent(
  type: string,
  init: { clientX?: number; clientY?: number; ctrlKey?: boolean } = {},
) {
  const event = new MouseEvent(type, { bubbles: true })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  Object.defineProperty(event, 'ctrlKey', { value: init.ctrlKey ?? false })
  Object.defineProperty(event, 'clientX', { value: init.clientX ?? 0 })
  Object.defineProperty(event, 'clientY', { value: init.clientY ?? 0 })
  return event
}

/** jsdom lays nothing out, so the container is given a 100x100 rect by hand. */
function fakeLayout(container: Element) {
  for (const element of [container, ...container.querySelectorAll('*')]) {
    Object.assign(element, {
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      hasPointerCapture: () => true,
      getBoundingClientRect: () =>
        ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
        }) as DOMRect,
    })
  }
}

type Handlers = { onChange?: (id: string, value: PointBaseType) => void }

function Subject({
  onChange,
  onSelectionChange,
  selection,
  selectable = true,
  limits,
}: Handlers & {
  onSelectionChange?: (ids: string[]) => void
  selection?: string[]
  selectable?: boolean
  limits?: Partial<Record<'a' | 'b', { max?: Partial<PointBaseType> }>>
}) {
  const [values, setValues] = useState<Record<string, PointBaseType>>({
    a: { x: 0.2, y: 0.2 },
    b: { x: 0.4, y: 0.4 },
    c: { x: 0.9, y: 0.9 },
  })

  return (
    <PointsEditor.Root
      selectable={selectable}
      selection={selection}
      onSelectionChange={onSelectionChange}
    >
      <PointsEditor.Container data-testid="container">
        {(['a', 'b', 'c'] as const).map((id) => (
          <PointsEditor.Point
            key={id}
            id={id}
            data-testid={id}
            value={values[id]}
            max={limits?.[id as 'a' | 'b']?.max}
            onChange={(v) => {
              // From the previous state: a selection moves several points in
              // the same tick, and a value captured in the render would throw
              // all but the last one away.
              setValues((all) => ({ ...all, [id]: v }))
              onChange?.(id, v)
            }}
          />
        ))}
      </PointsEditor.Container>
    </PointsEditor.Root>
  )
}

function setup(props: React.ComponentProps<typeof Subject> = {}) {
  const { container } = render(<Subject {...props} />)
  fakeLayout(container)
  return { container }
}

const point = (id: string) => screen.getByTestId(id)
const selected = (id: string) => point(id).getAttribute('data-selected')

function press(
  element: Element,
  init: { clientX?: number; clientY?: number; ctrlKey?: boolean } = {},
) {
  act(() => {
    element.dispatchEvent(pointerEvent('pointerdown', init))
  })
}

function move(
  element: Element,
  init: { clientX?: number; clientY?: number } = {},
) {
  act(() => {
    element.dispatchEvent(pointerEvent('pointermove', init))
  })
}

function release(element: Element) {
  act(() => {
    element.dispatchEvent(pointerEvent('pointerup'))
  })
}

/** A press and a release, for a gesture that is not going anywhere. */
function click(
  element: Element,
  init: { clientX?: number; clientY?: number; ctrlKey?: boolean } = {},
) {
  press(element, init)
  release(element)
}

describe('selecting points', () => {
  test('a press selects the point it landed on, alone', () => {
    setup()

    click(point('a'))
    expect(selected('a')).toBe('true')
    expect(selected('b')).toBe('false')

    click(point('b'))
    expect(selected('a')).toBe('false')
    expect(selected('b')).toBe('true')
  })

  test('ctrl adds to the selection rather than replacing it', () => {
    setup()

    click(point('a'))
    click(point('b'), { ctrlKey: true })

    expect(selected('a')).toBe('true')
    expect(selected('b')).toBe('true')
  })

  test('ctrl on a selected point takes it out again', () => {
    const onChange = vi.fn()
    setup({ onChange })

    click(point('a'))
    press(point('a'), { ctrlKey: true })
    expect(selected('a')).toBe('false')

    // The press was a deselect, so what follows it is not a move.
    move(point('a'), { clientX: 50, clientY: 50 })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('the selection is reported, and can be held by the caller', () => {
    const onSelectionChange = vi.fn()
    setup({ selection: ['c'], onSelectionChange })

    // Controlled: the prop decides, and a press only asks.
    expect(selected('c')).toBe('true')

    press(point('a'))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a'])
    expect(selected('a')).toBe('false')
    expect(selected('c')).toBe('true')
  })
})

describe('moving a selection', () => {
  test('dragging one point moves everything selected by the same amount', () => {
    const onChange = vi.fn()
    setup({ onChange })

    click(point('a'))
    press(point('b'), { ctrlKey: true })

    // Grabbed at the origin and moved a tenth of the way in on both axes.
    move(point('b'), { clientX: 10, clientY: 10 })

    expect(onChange).toHaveBeenCalledWith('a', { x: 0.3, y: 0.3 })
    expect(onChange).toHaveBeenCalledWith('b', { x: 0.5, y: 0.5 })
  })

  test('both points actually end up where they were moved to', () => {
    // The callbacks firing is not enough: they land in the same tick, so a
    // handler that rebuilt its state from a value captured in the render
    // would keep only the last one and one point would appear stuck.
    setup()

    click(point('a'))
    press(point('b'), { ctrlKey: true })
    move(point('b'), { clientX: 10, clientY: 10 })

    expect((point('a') as HTMLElement).style.left).toBe('30%')
    expect((point('b') as HTMLElement).style.left).toBe('50%')
  })

  test('the whole selection stops when one of them reaches its limit', () => {
    const onChange = vi.fn()
    setup({ onChange, limits: { b: { max: { x: 0.5 } } } })

    click(point('a'))
    press(point('b'), { ctrlKey: true })

    // Far enough to push b past its own maximum. Clamping each point on its
    // own would leave b behind while a carried on; one amount for both keeps
    // the shape of the selection.
    move(point('b'), { clientX: 80, clientY: 0 })

    expect(onChange).toHaveBeenCalledWith('a', { x: 0.3, y: 0.2 })
    expect(onChange).toHaveBeenCalledWith('b', { x: 0.5, y: 0.4 })
  })

  test('an arrow key moves the selection too', () => {
    const onChange = vi.fn()
    setup({ onChange })

    click(point('a'))
    click(point('b'), { ctrlKey: true })

    act(() => {
      point('b').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      )
    })

    // The default is a hundredth of the editor per press.
    expect(onChange).toHaveBeenCalledWith('a', { x: 0.21, y: 0.2 })
    expect(onChange).toHaveBeenCalledWith('b', { x: 0.41, y: 0.4 })
  })
})

describe('the selection box', () => {
  test('a drag on empty space selects what it covers', () => {
    const { container } = setup()
    const area = screen.getByTestId('container')

    press(area, { clientX: 0, clientY: 0 })
    move(area, { clientX: 50, clientY: 50 })

    expect(selected('a')).toBe('true')
    expect(selected('b')).toBe('true')
    expect(selected('c')).toBe('false')

    // It is drawn while the drag runs, and gone once it ends.
    expect(
      container.querySelector('.tremolo-points-editor-selection-box'),
    ).not.toBeNull()
    release(area)
    expect(
      container.querySelector('.tremolo-points-editor-selection-box'),
    ).toBeNull()
  })

  test('the focus lands on the selection, so the keys reach it', () => {
    const onChange = vi.fn()
    setup({ onChange })
    const area = screen.getByTestId('container')

    // The press on the container takes the focus out of the editor in a
    // browser, which would leave the selection with no way to be moved.
    act(() => (document.activeElement as HTMLElement | null)?.blur())
    press(area, { clientX: 0, clientY: 0 })
    move(area, { clientX: 50, clientY: 50 })
    release(area)

    const focused = document.activeElement as HTMLElement
    expect(focused.closest('.tremolo-points-editor-point')).toBe(point('a'))

    act(() => {
      focused.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      )
    })

    expect(onChange).toHaveBeenCalledWith('a', { x: 0.2, y: 0.21 })
    expect(onChange).toHaveBeenCalledWith('b', { x: 0.4, y: 0.41 })
  })

  test('a plain drag on empty space clears the selection first', () => {
    setup()

    click(point('c'))
    expect(selected('c')).toBe('true')

    const area = screen.getByTestId('container')
    press(area, { clientX: 0, clientY: 0 })
    expect(selected('c')).toBe('false')
  })

  test('a press on a point is left to the point', () => {
    const { container } = setup()

    click(point('a'))

    // No selection box: the container declined the press before taking the
    // pointer capture away from the point.
    expect(
      container.querySelector('.tremolo-points-editor-selection-box'),
    ).toBeNull()
    expect(selected('a')).toBe('true')
  })
})

describe('with selection turned off', () => {
  test('a press selects nothing', () => {
    setup({ selectable: false })

    click(point('a'))

    expect(selected('a')).toBe('false')
  })

  test('a drag still moves the point it started on', () => {
    const onChange = vi.fn()
    setup({ selectable: false, onChange })

    press(point('a'))
    move(point('a'), { clientX: 10, clientY: 10 })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('a', { x: 0.3, y: 0.3 })
  })

  test('a drag on empty space draws no selection box', () => {
    const { container } = setup({ selectable: false })
    const area = screen.getByTestId('container')

    press(area, { clientX: 0, clientY: 0 })
    move(area, { clientX: 50, clientY: 50 })

    expect(
      container.querySelector('.tremolo-points-editor-selection-box'),
    ).toBeNull()
    expect(selected('a')).toBe('false')
  })
})
