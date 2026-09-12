import { act, render, screen } from '@testing-library/react'
import { ComponentProps, useRef } from 'react'

import { Slider } from './index'

import type { SliderThumbMethods } from './Thumb'

function Subject({ children, ...props }: ComponentProps<typeof Slider.Thumb>) {
  return (
    <Slider.Root value={25} min={0} max={100}>
      <Slider.Track>
        <Slider.Thumb data-testid="thumb" {...props}>
          {children}
        </Slider.Thumb>
      </Slider.Track>
    </Slider.Root>
  )
}

const thumb = () => screen.getByTestId('thumb')

describe('Slider.Thumb', () => {
  test('is a single element, and children go inside it', () => {
    render(
      <Subject>
        <img src="thumb.png" alt="" />
      </Subject>,
    )

    expect(thumb()).toHaveClass('tremolo-slider-thumb')
    expect(thumb().querySelector('img')).not.toBeNull()
    // Nothing wraps it: the element the caller sees is the positioned one.
    expect(thumb().parentElement).toHaveClass('tremolo-slider-track')
  })

  test('renders children that are falsy, rather than replacing them', () => {
    render(<Subject>{0}</Subject>)

    expect(thumb()).toHaveTextContent('0')
  })

  test('applies className and style whether or not children are given', () => {
    const { rerender } = render(
      <Subject className="mine" style={{ background: 'none' }} />,
    )
    expect(thumb()).toHaveClass('mine')
    expect(thumb()).toHaveStyle({ background: 'none' })

    rerender(
      <Subject className="mine" style={{ background: 'none' }}>
        <span>x</span>
      </Subject>,
    )
    expect(thumb()).toHaveClass('mine')
    expect(thumb()).toHaveStyle({ background: 'none' })
  })

  test('keeps its position when the caller styles it', () => {
    render(<Subject style={{ left: '80%' }} />)

    // The component writes the position last, so a stray `left` cannot take
    // the thumb off the track.
    expect(thumb()).toHaveStyle({ left: '25%' })
  })

  test('focuses through the ref with children in place', () => {
    function WithRef() {
      const ref = useRef<SliderThumbMethods>(null)
      return (
        <>
          <button onClick={() => ref.current?.focus()}>focus</button>
          <Slider.Root value={0} min={0} max={100}>
            <Slider.Track>
              <Slider.Thumb ref={ref} data-testid="thumb">
                <span>custom</span>
              </Slider.Thumb>
            </Slider.Track>
          </Slider.Root>
        </>
      )
    }
    render(<WithRef />)

    act(() => screen.getByText('focus').click())

    expect(screen.getByRole('slider')).toHaveFocus()
  })
})
