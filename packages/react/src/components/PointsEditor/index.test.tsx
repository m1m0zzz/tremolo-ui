import { act, fireEvent, render, screen } from '@testing-library/react'
import { createRef, useState } from 'react'

import { PointBaseType, PointsEditor, PointProps } from '.'

import type { Mock } from 'vitest'

// jsdom has no PointerEvent and no pointer capture, so both are faked here.
function pointerEvent(
  type: string,
  init: { clientX?: number; clientY?: number } = {},
) {
  const event = new MouseEvent(type, { bubbles: true })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  for (const [key, value] of Object.entries(init)) {
    Object.defineProperty(event, key, { value })
  }
  return event
}

/** jsdom lays nothing out, so the container is given a 200x100 rect by hand. */
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
          right: 200,
          bottom: 100,
          width: 200,
          height: 100,
        }) as DOMRect,
    })
  }
}

type SubjectProps = Partial<
  Pick<
    React.ComponentProps<typeof PointsEditor.Root>,
    'disabled' | 'readonly' | 'wheel' | 'keyboard'
  >
> & {
  point?: Partial<PointProps<PointBaseType>>
  initial?: PointBaseType
  onChange?: (value: PointBaseType) => void
}

function Subject({
  point,
  initial = { x: 0.5, y: 0.5 },
  onChange,
  ...rootProps
}: SubjectProps) {
  const [value, setValue] = useState(initial)

  return (
    <PointsEditor.Root {...rootProps}>
      <PointsEditor.Background data-testid="background" />
      <PointsEditor.Container data-testid="container">
        <PointsEditor.Point
          data-testid="point"
          value={value}
          onChange={(v) => {
            setValue(v)
            onChange?.(v)
          }}
          {...point}
        />
      </PointsEditor.Container>
    </PointsEditor.Root>
  )
}

/** Two points, to pin down which one an event reaches. */
function TwoPoints({ onA, onB }: { onA: Mock; onB: Mock }) {
  const [a, setA] = useState<PointBaseType>({ x: 0.25, y: 0.5 })
  const [b, setB] = useState<PointBaseType>({ x: 0.75, y: 0.5 })

  return (
    <PointsEditor.Root>
      <PointsEditor.Container data-testid="two-container">
        <PointsEditor.Point
          data-testid="a"
          value={a}
          onChange={(v) => {
            setA(v)
            onA(v)
          }}
        />
        <PointsEditor.Point
          data-testid="b"
          value={b}
          onChange={(v) => {
            setB(v)
            onB(v)
          }}
        />
      </PointsEditor.Container>
    </PointsEditor.Root>
  )
}

function setup(props: SubjectProps = {}) {
  const onChange = vi.fn()
  const { container } = render(<Subject onChange={onChange} {...props} />)
  fakeLayout(container)
  return { container, onChange, point: screen.getByTestId('point') }
}

function pointInput(point: Element, axis: 'x' | 'y') {
  return point.querySelector<HTMLInputElement>(`input[data-axis="${axis}"]`)!
}

function drag(
  point: Element,
  to: { clientX: number; clientY: number },
  from: { clientX: number; clientY: number } = { clientX: 0, clientY: 0 },
) {
  act(() => {
    point.dispatchEvent(pointerEvent('pointerdown', from))
  })
  act(() => {
    point.dispatchEvent(pointerEvent('pointermove', to))
  })
}

function keyDown(point: Element, key: string) {
  act(() => {
    point.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

function wheel(point: Element, init: { deltaY: number; shiftKey?: boolean }) {
  act(() => {
    point.dispatchEvent(new WheelEvent('wheel', { bubbles: true, ...init }))
  })
}

describe('PointsEditor', () => {
  test('renders the children as they are composed', () => {
    setup()

    expect(screen.getByTestId('background').className).toBe(
      'tremolo-points-editor-background',
    )
    expect(screen.getByTestId('container').className).toBe(
      'tremolo-points-editor-container',
    )
    expect(screen.getByTestId('point').className).toBe(
      'tremolo-points-editor-point',
    )
  })

  test('places a point by its value within the container', () => {
    const { point } = setup({ initial: { x: 0.25, y: 0.75 } })

    expect(point.getAttribute('style')).toContain('left: 25%')
    expect(point.getAttribute('style')).toContain('top: 75%')
  })

  test('exposes one named range input for each axis', () => {
    const { point, onChange } = setup({
      point: { 'aria-label': { x: 'Time', y: 'Level' } },
    })
    const x = pointInput(point, 'x')
    const y = pointInput(point, 'y')

    expect(x).toHaveAccessibleName('Time')
    expect(x).toHaveValue('0.5')
    expect(y).toHaveAccessibleName('Level')
    expect(y).toHaveValue('0.5')

    fireEvent.change(x, { target: { value: '0.75' } })
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.75, y: 0.5 })
  })

  test('a drag moves the point by the distance dragged', () => {
    const { point, onChange } = setup()

    // Grabbed at the top left corner and moved a quarter of the way in on
    // both axes: the point keeps the offset it was grabbed at rather than
    // jumping under the pointer.
    drag(point, { clientX: 50, clientY: 25 })

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.75, y: 0.75 })
  })

  test('min and max clamp what a drag reports', () => {
    const { point, onChange } = setup({
      point: { min: { x: 0.4 }, max: { y: 0.6 } },
    })

    // Grabbed at the point itself, then dragged to the bottom left corner:
    // both limits are in the way.
    drag(point, { clientX: 0, clientY: 100 }, { clientX: 100, clientY: 50 })

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.4, y: 0.6 })
  })

  test('readonly on Root reaches the points', () => {
    const { point, onChange } = setup({ readonly: true })

    expect(point).toHaveAttribute('data-readonly')
    expect(pointInput(point, 'x')).not.toBeDisabled()
    expect(pointInput(point, 'y')).not.toBeDisabled()
    drag(point, { clientX: 50, clientY: 25 })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('a point can override the readonly of Root', () => {
    const { point, onChange } = setup({
      readonly: true,
      point: { readonly: false },
    })

    expect(point).not.toHaveAttribute('data-readonly')
    drag(point, { clientX: 50, clientY: 25 })
    expect(onChange).toHaveBeenCalled()
  })

  test('disabled reaches the points and leaves every input inert', () => {
    const { point, onChange } = setup({ disabled: true })

    expect(point).toHaveAttribute('data-disabled')
    drag(point, { clientX: 50, clientY: 25 })
    keyDown(point, 'ArrowRight')
    act(() => pointInput(point, 'x').focus())
    wheel(point, { deltaY: -1 })

    expect(pointInput(point, 'x')).toBeDisabled()
    expect(pointInput(point, 'y')).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()
  })

  test('a point can override the disabled state of Root', () => {
    const { point, onChange } = setup({
      disabled: true,
      point: { disabled: false },
    })

    expect(point).not.toHaveAttribute('data-disabled')
    drag(point, { clientX: 50, clientY: 25 })
    expect(onChange).toHaveBeenCalled()
  })

  test('the arrow keys nudge the point, with y growing downwards', () => {
    const { point, onChange } = setup()

    keyDown(point, 'ArrowRight')
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.51, y: 0.5 })

    keyDown(point, 'ArrowUp')
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.51, y: 0.49 })

    keyDown(point, 'ArrowLeft')
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.49 })

    keyDown(point, 'ArrowDown')
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.5 })
  })

  test('focus reaching the point is handed to its input', () => {
    const { point } = setup()

    // A press lands on the point, which the browser answers by clearing the
    // focus unless the point can take it. It takes it, and passes it on.
    expect(point).toHaveAttribute('tabindex', '-1')
    act(() => (point as HTMLElement).focus())

    expect(document.activeElement).toBe(pointInput(point, 'x'))
  })

  test('one name covers both axes of a point', () => {
    setup({ point: { 'aria-label': 'Handle' } })

    expect(screen.getAllByRole('slider', { name: 'Handle' })).toHaveLength(2)
  })

  test('the arrow keys move both axes, from either input', () => {
    const { point, onChange } = setup()

    // The focus lands on the x input, so up and down have to move y from
    // there: the point is one control to the person moving it.
    fireEvent.keyDown(pointInput(point, 'x'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.49 })

    fireEvent.keyDown(pointInput(point, 'y'), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.51, y: 0.49 })
  })

  test('a keyboard nudge stops at min and max', () => {
    const { point, onChange } = setup({
      initial: { x: 0, y: 0.5 },
      point: { min: { x: 0 } },
    })

    keyDown(point, 'ArrowLeft')
    expect(onChange).toHaveBeenLastCalledWith({ x: 0, y: 0.5 })
  })

  test('keyboard={null} on Root turns the arrow keys off', () => {
    const { point, onChange } = setup({ keyboard: null })

    keyDown(point, 'ArrowRight')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('a point can turn the keyboard back on, and pick its own step', () => {
    const { point, onChange } = setup({
      keyboard: null,
      point: { keyboard: ['normalized', 0.1] },
    })

    keyDown(point, 'ArrowRight')
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.6, y: 0.5 })
  })

  test('readonly leaves the arrow keys inert', () => {
    const { point, onChange } = setup({ readonly: true })

    keyDown(point, 'ArrowRight')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('the wheel only acts once the point has focus', () => {
    const { point, onChange } = setup()

    wheel(point, { deltaY: -1 })
    expect(onChange).not.toHaveBeenCalled()

    act(() => pointInput(point, 'x').focus())
    wheel(point, { deltaY: -1 })
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.49 })
  })

  test('the wheel reaches the focused point from anywhere over the editor', () => {
    const { point, onChange } = setup()

    act(() => pointInput(point, 'x').focus())
    // Nowhere near the point: the listener is on the container, not on the
    // 16px point the cursor would otherwise have to stay on.
    wheel(screen.getByTestId('container'), { deltaY: -1 })

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.49 })
  })

  test('the wheel moves the focused point, not the one under the cursor', () => {
    const onA = vi.fn()
    const onB = vi.fn()
    render(<TwoPoints onA={onA} onB={onB} />)

    act(() => pointInput(screen.getByTestId('a'), 'x').focus())
    wheel(screen.getByTestId('b'), { deltaY: -1 })

    expect(onA).toHaveBeenLastCalledWith({ x: 0.25, y: 0.49 })
    expect(onB).not.toHaveBeenCalled()
  })

  test('draws the children inside the point', () => {
    const { point } = setup({ point: { children: <span>knob</span> } })

    // The theme draws the point itself, so what a caller passes has to reach
    // the same element rather than replace it.
    expect(point).toHaveClass('tremolo-points-editor-point')
    expect(point).toHaveTextContent('knob')
    expect(point.querySelectorAll('input[type="range"]')).toHaveLength(2)
  })

  test('registers one wheel listener, however many points are mounted', () => {
    const original = HTMLElement.prototype.addEventListener
    const targets: HTMLElement[] = []
    const addEventListener = vi
      .spyOn(HTMLElement.prototype, 'addEventListener')
      .mockImplementation(function (
        this: HTMLElement,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
      ) {
        if (type === 'wheel') targets.push(this)
        return original.call(this, type, listener, options)
      })
    render(<TwoPoints onA={vi.fn()} onB={vi.fn()} />)
    addEventListener.mockRestore()

    // React's own delegation listens on the root it rendered into, so only the
    // editor's own listeners are counted: one, on the container. One per point
    // would grow with the editor, and every one of them would run on every
    // notch of the wheel.
    const own = targets.filter((target) =>
      target.closest('.tremolo-points-editor'),
    )
    expect(own).toHaveLength(1)
    expect(own[0]).toHaveClass('tremolo-points-editor-container')
  })

  test('only one point acts, however many are mounted', () => {
    const onA = vi.fn()
    const onB = vi.fn()
    render(<TwoPoints onA={onA} onB={onB} />)

    act(() => pointInput(screen.getByTestId('a'), 'x').focus())
    wheel(screen.getByTestId('two-container'), { deltaY: -1 })

    expect(onA).toHaveBeenCalledTimes(1)
    expect(onB).not.toHaveBeenCalled()
  })

  test('the wheel takes the scroll only while a point has focus', () => {
    const { point } = setup()

    const ignored = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -1,
    })
    act(() => {
      point.dispatchEvent(ignored)
    })
    expect(ignored.defaultPrevented).toBe(false)

    act(() => pointInput(point, 'x').focus())
    const taken = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -1,
    })
    act(() => {
      point.dispatchEvent(taken)
    })
    expect(taken.defaultPrevented).toBe(true)
  })

  test('shift makes the wheel move the x axis', () => {
    const { point, onChange } = setup()

    act(() => pointInput(point, 'x').focus())
    wheel(point, { deltaY: 1, shiftKey: true })

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.51, y: 0.5 })
  })

  test('wheel={null} on Root turns the wheel off', () => {
    const { point, onChange } = setup({ wheel: null })

    act(() => pointInput(point, 'x').focus())
    wheel(point, { deltaY: -1 })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('Container passes its element on to the caller as well', () => {
    const ref = createRef<HTMLDivElement>()

    render(
      <PointsEditor.Root>
        <PointsEditor.Container ref={ref} data-testid="container" />
      </PointsEditor.Root>,
    )

    expect(ref.current).toBe(screen.getByTestId('container'))
  })

  test('a subcomponent outside Root says so', () => {
    // The error is expected; keep it out of the test output.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<PointsEditor.Container />)).toThrow(
      'Missing PointsEditorContext.Provider in the tree',
    )

    spy.mockRestore()
  })
})
