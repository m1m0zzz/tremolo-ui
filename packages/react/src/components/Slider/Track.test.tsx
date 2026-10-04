import { render, screen } from '@testing-library/react'

import { Slider } from '.'

describe('Slider.Track', () => {
  test('activeColor and inactiveColor set the custom properties the theme reads', () => {
    render(
      <Slider.Root value={50} min={0} max={100}>
        <Slider.Track
          data-testid="track"
          activeColor="red"
          inactiveColor="blue"
        >
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Root>,
    )

    const track = screen.getByTestId('track')
    expect(track.style.getPropertyValue('--active-color')).toBe('red')
    expect(track.style.getPropertyValue('--inactive-color')).toBe('blue')
  })
})
