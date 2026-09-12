import { render, screen } from '@testing-library/react'
import { ComponentProps } from 'react'

import { Slider } from './index'

function Subject(props: ComponentProps<typeof Slider.MarksOption>) {
  return (
    <Slider.Root value={25} min={0} max={100}>
      <Slider.Track>
        <Slider.Thumb />
      </Slider.Track>
      <Slider.Marks>
        <Slider.MarksOption data-testid="option" {...props} />
      </Slider.Marks>
    </Slider.Root>
  )
}

const option = () => screen.getByTestId('option')
const mark = () => option().querySelector('.tremolo-slider-marks-option-mark')
const label = () => option().querySelector('.tremolo-slider-marks-option-label')

describe('Slider.MarksOption', () => {
  test('draws the mark and the value by default', () => {
    render(<Subject value={50} />)

    expect(mark()).not.toBeNull()
    expect(label()).toHaveTextContent('50')
  })

  test('keeps an empty label empty, rather than falling back to the value', () => {
    render(<Subject value={50} label="" />)

    expect(label()).not.toBeNull()
    expect(label()).toBeEmptyDOMElement()
  })

  test('leaves the label out when it is null', () => {
    render(<Subject value={50} label={null} />)

    expect(mark()).not.toBeNull()
    expect(label()).toBeNull()
  })

  test('leaves the mark out when it is off', () => {
    render(<Subject value={50} mark={false} />)

    expect(mark()).toBeNull()
    expect(label()).toHaveTextContent('50')
  })

  test('takes a number as the label', () => {
    render(<Subject value={50} label={0} />)

    expect(label()).toHaveTextContent('0')
  })
})
