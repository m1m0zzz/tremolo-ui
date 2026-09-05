import { act, render, screen } from '@testing-library/react'
import { createRef, useState } from 'react'

import {
  PointBaseType,
  PointsEditor,
  PointProps,
} from '../../src/components/PointsEditor'

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
function TwoPoints({ onA, onB }: { onA: jest.Mock; onB: jest.Mock }) {
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
  const onChange = jest.fn()
  const { container } = render(<Subject onChange={onChange} {...props} />)
  fakeLayout(container)
  return { container, onChange, point: screen.getByTestId('point') }
}

function drag(point: Element, to: { clientX: number; clientY: number }) {
  act(() => {
    point.dispatchEvent(pointerEvent('pointerdown', { clientX: 0, clientY: 0 }))
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

  test('a drag reports the position pointed at, not the distance moved', () => {
    const { point, onChange } = setup()

    drag(point, { clientX: 50, clientY: 25 })

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.25, y: 0.25 })
  })

  test('min and max clamp what a drag reports', () => {
    const { point, onChange } = setup({
      point: { min: { x: 0.4 }, max: { y: 0.6 } },
    })

    drag(point, { clientX: 0, clientY: 100 })

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.4, y: 0.6 })
  })

  test('readonly on Root reaches the points', () => {
    const { point, onChange } = setup({ readonly: true })

    expect(point.getAttribute('aria-readonly')).toBe('true')
    drag(point, { clientX: 50, clientY: 25 })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('a point can override the readonly of Root', () => {
    const { point, onChange } = setup({
      readonly: true,
      point: { readonly: false },
    })

    expect(point.getAttribute('aria-readonly')).toBe('false')
    drag(point, { clientX: 50, clientY: 25 })
    expect(onChange).toHaveBeenCalled()
  })

  test('disabled reaches the points, and only changes the appearance', () => {
    const { point, onChange } = setup({ disabled: true })

    expect(point.getAttribute('aria-disabled')).toBe('true')
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

    act(() => (point as HTMLElement).focus())
    wheel(point, { deltaY: -1 })
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.49 })
  })

  test('the wheel reaches the focused point from anywhere over the editor', () => {
    const { point, onChange } = setup()

    act(() => (point as HTMLElement).focus())
    // Nowhere near the point: the listener is on the container, not on the
    // 16px point the cursor would otherwise have to stay on.
    wheel(screen.getByTestId('container'), { deltaY: -1 })

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.49 })
  })

  test('the wheel moves the focused point, not the one under the cursor', () => {
    const onA = jest.fn()
    const onB = jest.fn()
    render(<TwoPoints onA={onA} onB={onB} />)

    act(() => (screen.getByTestId('a') as HTMLElement).focus())
    wheel(screen.getByTestId('b'), { deltaY: -1 })

    expect(onA).toHaveBeenLastCalledWith({ x: 0.25, y: 0.49 })
    expect(onB).not.toHaveBeenCalled()
  })

  test('only one point acts, however many are mounted', () => {
    const onA = jest.fn()
    const onB = jest.fn()
    render(<TwoPoints onA={onA} onB={onB} />)

    act(() => (screen.getByTestId('a') as HTMLElement).focus())
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

    act(() => (point as HTMLElement).focus())
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

    act(() => (point as HTMLElement).focus())
    wheel(point, { deltaY: 1, shiftKey: true })

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.51, y: 0.5 })
  })

  test('wheel={null} on Root turns the wheel off', () => {
    const { point, onChange } = setup({ wheel: null })

    act(() => (point as HTMLElement).focus())
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
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<PointsEditor.Container />)).toThrow(
      'Missing PointsEditorContext.Provider in the tree',
    )

    spy.mockRestore()
  })
})
