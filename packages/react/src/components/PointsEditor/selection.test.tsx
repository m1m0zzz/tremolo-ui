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
  limits,
}: Handlers & {
  onSelectionChange?: (ids: string[]) => void
  selection?: string[]
  limits?: Partial<Record<'a' | 'b', { max?: Partial<PointBaseType> }>>
}) {
  const [values, setValues] = useState<Record<string, PointBaseType>>({
    a: { x: 0.2, y: 0.2 },
    b: { x: 0.4, y: 0.4 },
    c: { x: 0.9, y: 0.9 },
  })

  return (
    <PointsEditor.Root
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
    const onChange = jest.fn()
    setup({ onChange })

    click(point('a'))
    press(point('a'), { ctrlKey: true })
    expect(selected('a')).toBe('false')

    // The press was a deselect, so what follows it is not a move.
    move(point('a'), { clientX: 50, clientY: 50 })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('the selection is reported, and can be held by the caller', () => {
    const onSelectionChange = jest.fn()
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
    const onChange = jest.fn()
    setup({ onChange })

    click(point('a'))
    press(point('b'), { ctrlKey: true })

    // Grabbed at the origin and moved a tenth of the way in on both axes.
    move(point('b'), { clientX: 10, clientY: 10 })

    expect(onChange).toHaveBeenCalledWith('a', { x: 0.3, y: 0.3 })
    expect(onChange).toHaveBeenCalledWith('b', { x: 0.5, y: 0.5 })
  })

  test('the whole selection stops when one of them reaches its limit', () => {
    const onChange = jest.fn()
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
    const onChange = jest.fn()
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

describe('the rubber band', () => {
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
      container.querySelector('.tremolo-points-editor-marquee'),
    ).not.toBeNull()
    release(area)
    expect(container.querySelector('.tremolo-points-editor-marquee')).toBeNull()
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

    // No rubber band: the container declined the press before taking the
    // pointer capture away from the point.
    expect(container.querySelector('.tremolo-points-editor-marquee')).toBeNull()
    expect(selected('a')).toBe('true')
  })
})
