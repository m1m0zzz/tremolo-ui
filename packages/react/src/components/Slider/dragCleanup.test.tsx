import { act, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { Slider } from '.'

function pointerEvent(type: string, clientX: number) {
  const event = new MouseEvent(type, { bubbles: true, clientX })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return event
}

function fakePointer(element: Element) {
  const captured = new Set<number>()
  Object.assign(element, {
    setPointerCapture: (pointerId: number) => captured.add(pointerId),
    releasePointerCapture: (pointerId: number) => captured.delete(pointerId),
    hasPointerCapture: (pointerId: number) => captured.has(pointerId),
  })
}

function Subject({ readonly = false }: { readonly?: boolean }) {
  const [value, setValue] = useState(0)

  return (
    <Slider.Root
      value={value}
      min={0}
      max={100}
      readonly={readonly}
      data-testid="root"
      onChange={setValue}
    >
      <Slider.Track />
    </Slider.Root>
  )
}

function startDrag(root: Element) {
  fakePointer(root)
  act(() => {
    root.dispatchEvent(pointerEvent('pointerdown', 0))
  })
}

afterEach(() => {
  document.body.style.removeProperty('user-select')
  document.body.style.removeProperty('-webkit-user-select')
})

describe('Slider drag cleanup', () => {
  test('restores the body style when unmounted during a drag', () => {
    document.body.style.setProperty('user-select', 'text')
    const { unmount } = render(<Subject />)
    const root = screen.getByTestId('root')

    startDrag(root)
    expect(document.body).toHaveStyle('user-select: none')

    unmount()
    expect(document.body).toHaveStyle('user-select: text')
  })

  test('restores the body style when readonly changes during a drag', () => {
    document.body.style.setProperty('user-select', 'text')
    const { rerender } = render(<Subject />)
    const root = screen.getByTestId('root')

    startDrag(root)
    expect(document.body).toHaveStyle('user-select: none')

    rerender(<Subject readonly />)
    act(() => {
      root.dispatchEvent(pointerEvent('pointerup', 0))
    })

    expect(document.body).toHaveStyle('user-select: text')
  })
})
