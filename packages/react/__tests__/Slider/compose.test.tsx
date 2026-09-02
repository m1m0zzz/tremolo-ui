import { render } from '@testing-library/react'
import { useRef } from 'react'

import { Slider } from '../../src/components/Slider'
import { XYPad } from '../../src/components/XYPad'

describe('a caller ref reaches the element the context also uses', () => {
  test('Slider.Track', () => {
    let seen: HTMLDivElement | null = null

    function Subject() {
      const ref = useRef<HTMLDivElement>(null)
      seen = ref.current
      return (
        <Slider.Root value={50} min={0} max={100}>
          <Slider.Track
            ref={(node) => {
              seen = node
            }}
          >
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Root>
      )
    }

    const { container } = render(<Subject />)
    expect(seen).toBe(container.querySelector('.tremolo-slider-track'))
  })

  test('XYPad.Area', () => {
    let seen: HTMLDivElement | null = null

    const { container } = render(
      <XYPad.Root value={[0, 0]} min={0} max={100}>
        <XYPad.Area
          ref={(node) => {
            seen = node
          }}
        >
          <XYPad.Thumb />
        </XYPad.Area>
      </XYPad.Root>,
    )
    expect(seen).toBe(container.querySelector('.tremolo-xy-pad-area'))
  })
})
