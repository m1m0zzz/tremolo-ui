import { fireEvent, render, screen } from '@testing-library/react'

import { Knob } from '.'

describe('Knob.Thumb', () => {
  test('forwards className, data attributes, and SVG event handlers', () => {
    const onClick = vi.fn()
    render(
      <Knob.Root value={50} min={0} max={100}>
        <Knob.SVGRoot>
          <Knob.Thumb
            className="custom-thumb"
            data-testid="thumb"
            data-part="handle"
            onClick={onClick}
          />
        </Knob.SVGRoot>
      </Knob.Root>,
    )

    const thumb = screen.getByTestId('thumb')
    expect(thumb).toHaveClass('custom-thumb')
    expect(thumb).toHaveAttribute('data-part', 'handle')
    fireEvent.click(thumb)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('color fills the circle, and lineColor and classes.line go to the line', () => {
    render(
      <Knob.Root value={50} min={0} max={100}>
        <Knob.SVGRoot>
          <Knob.Thumb
            data-testid="thumb"
            color="red"
            lineColor="blue"
            classes={{ line: 'custom-line' }}
          />
        </Knob.SVGRoot>
      </Knob.Root>,
    )

    const thumb = screen.getByTestId('thumb')
    expect(thumb.querySelector('circle')).toHaveAttribute('fill', 'red')
    const line = thumb.querySelector('line')
    expect(line).toHaveAttribute('stroke', 'blue')
    expect(line).toHaveClass('custom-line')
  })
})
