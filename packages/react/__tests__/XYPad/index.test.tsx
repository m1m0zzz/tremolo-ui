import { act, render, screen } from '@testing-library/react'
import { createRef, useState } from 'react'

import { exponentialScale, linearScale } from '@tremolo-ui/functions'

import { XYPad, XYPadMethods, type XY } from '../../src/components/XYPad'

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

/** jsdom lays nothing out, so every element is given the same 100x100 rect. */
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

type SubjectProps = Omit<
  Partial<React.ComponentProps<typeof XYPad.Root>>,
  'children' | 'onChange'
> & {
  initial?: XY<number>
  onChange?: (value: XY<number>) => void
}

function Subject({
  initial = [50, 50],
  onChange,
  ref,
  ...props
}: SubjectProps & { ref?: React.Ref<XYPadMethods> }) {
  const [value, setValue] = useState<XY<number>>(initial)

  return (
    <XYPad.Root
      ref={ref}
      value={value}
      min={0}
      max={100}
      data-testid="root"
      {...props}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    >
      <XYPad.Area data-testid="area">
        <XYPad.Thumb data-testid="thumb" />
      </XYPad.Area>
    </XYPad.Root>
  )
}

function setup(props: SubjectProps & { ref?: React.Ref<XYPadMethods> } = {}) {
  const onChange = jest.fn()
  const { container } = render(<Subject onChange={onChange} {...props} />)
  fakeLayout(container)
  return { container, onChange, root: screen.getByTestId('root') }
}

const drag = (root: Element, to: { clientX: number; clientY: number }) => {
  act(() => {
    root.dispatchEvent(pointerEvent('pointerdown', to))
  })
}

const keyDown = (root: Element, key: string) =>
  act(() => {
    root.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })

const wheel = (root: Element, init: { deltaY: number; shiftKey?: boolean }) =>
  act(() => {
    root.dispatchEvent(new WheelEvent('wheel', { bubbles: true, ...init }))
  })

/** The wrapper carries the position, as a percentage of the area. */
const thumbPosition = () =>
  screen.getByTestId('thumb').getAttribute('style') ?? ''

/**
 * The focusable element is the default thumb the wrapper renders, not the
 * wrapper itself, so a test that focuses has to reach past the test id.
 */
const thumbElement = () =>
  document.querySelector<HTMLElement>('.tremolo-xy-pad-thumb')!

describe('XYPad', () => {
  test('places the thumb from the value of each axis', () => {
    setup({ initial: [25, 75] })

    expect(thumbPosition()).toContain('left: 25%')
    expect(thumbPosition()).toContain('top: 75%')
  })

  test('y is measured from the top, so it is not flipped for display', () => {
    setup({ initial: [0, 100] })

    expect(thumbPosition()).toContain('left: 0%')
    expect(thumbPosition()).toContain('top: 100%')
  })

  test('a press reports the position pointed at on both axes', () => {
    const { onChange, root } = setup()

    drag(root, { clientX: 20, clientY: 40 })

    expect(onChange).toHaveBeenLastCalledWith([20, 40])
  })

  test('reverse can be set for one axis alone', () => {
    const { onChange, root } = setup({ reverse: [true, false] })

    drag(root, { clientX: 20, clientY: 40 })

    expect(onChange).toHaveBeenLastCalledWith([80, 40])
  })

  test('min, max and step can differ between the axes', () => {
    const { onChange, root } = setup({
      initial: [0, 0],
      min: [0, -50],
      max: [10, 50],
      step: [1, 25],
    })

    drag(root, { clientX: 55, clientY: 40 })

    // x: 55% of 0..10, rounded to a step of 1. y: 40% of -50..50 is -10,
    // which the step of 25 rounds to 0.
    expect(onChange).toHaveBeenLastCalledWith([6, 0])
  })

  test('a scale applies per axis', () => {
    const { onChange, root } = setup({
      initial: [1, 1],
      min: 1,
      max: 1000,
      step: 0,
      scale: [exponentialScale, linearScale],
    })

    drag(root, { clientX: 50, clientY: 50 })

    const [x, y] = onChange.mock.calls.at(-1)![0]
    // Halfway along an exponential 1..1000 is the geometric mean, not 500.
    expect(x).toBeCloseTo(Math.sqrt(1000), 5)
    expect(y).toBeCloseTo(500.5, 5)
  })

  test('the arrow keys move one axis each', () => {
    const { onChange, root } = setup()

    keyDown(root, 'ArrowRight')
    expect(onChange).toHaveBeenLastCalledWith([51, 50])

    keyDown(root, 'ArrowLeft')
    expect(onChange).toHaveBeenLastCalledWith([50, 50])

    keyDown(root, 'ArrowDown')
    expect(onChange).toHaveBeenLastCalledWith([50, 51])

    keyDown(root, 'ArrowUp')
    expect(onChange).toHaveBeenLastCalledWith([50, 50])
  })

  test('reverse flips the direction the arrow keys move', () => {
    const { onChange, root } = setup({ reverse: [true, false] })

    keyDown(root, 'ArrowRight')
    expect(onChange).toHaveBeenLastCalledWith([49, 50])
  })

  test('the wheel moves y, and x while shift is held', () => {
    const { onChange, root } = setup()

    act(() => thumbElement().focus())

    wheel(root, { deltaY: -1 })
    expect(onChange).toHaveBeenLastCalledWith([50, 49])

    wheel(root, { deltaY: -1, shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith([49, 49])
  })

  test('the wheel does nothing until the focus is inside', () => {
    const { onChange, root } = setup()

    wheel(root, { deltaY: -1 })

    expect(onChange).not.toHaveBeenCalled()
  })

  test('readonly leaves every input inert', () => {
    const { onChange, root } = setup({ readonly: true })

    drag(root, { clientX: 20, clientY: 40 })
    keyDown(root, 'ArrowRight')
    act(() => thumbElement().focus())
    wheel(root, { deltaY: -1 })

    expect(onChange).not.toHaveBeenCalled()
    expect(root.getAttribute('aria-readonly')).toBe('true')
  })

  test('disabled only changes the appearance', () => {
    const { onChange, root } = setup({ disabled: true })

    drag(root, { clientX: 20, clientY: 40 })

    expect(root.getAttribute('aria-disabled')).toBe('true')
    expect(onChange).toHaveBeenCalled()
  })

  test('wheel={null} and keyboard={null} turn those inputs off', () => {
    const { onChange, root } = setup({ wheel: null, keyboard: null })

    keyDown(root, 'ArrowRight')
    act(() => thumbElement().focus())
    wheel(root, { deltaY: -1 })

    expect(onChange).not.toHaveBeenCalled()
  })

  test('a single setting applies to both axes', () => {
    const { onChange, root } = setup({ reverse: true })

    drag(root, { clientX: 20, clientY: 40 })

    expect(onChange).toHaveBeenLastCalledWith([80, 60])
  })

  test('the ref focuses and blurs the thumb', () => {
    const ref = createRef<XYPadMethods>()
    setup({ ref })

    act(() => ref.current?.focus())
    expect(document.activeElement).toBe(thumbElement())

    act(() => ref.current?.blur())
    expect(document.activeElement).not.toBe(thumbElement())
  })

  test('a drag focuses the thumb wherever it was placed', () => {
    const { root } = setup()

    drag(root, { clientX: 20, clientY: 40 })

    expect(document.activeElement).toBe(thumbElement())
  })
})
