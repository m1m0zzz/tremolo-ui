import { render, screen } from '@testing-library/react'

import { Slider } from './components/Slider'

import type { CSSVariables } from './css-variables'

// These are checked by `tsc`, not by the assertions: each line either compiles
// or carries the error it is expected to raise.

test('a style takes the custom properties of the part, and any other', () => {
  render(
    <Slider.Root value={50} min={0} max={100}>
      <Slider.Track
        data-testid="track"
        style={{
          // Named by the part, so an editor offers it.
          '--thickness': '16px',
          // A theme's own variable is not refused.
          '--axis': 'to right',
          height: 4,
        }}
      >
        <Slider.Thumb />
      </Slider.Track>
    </Slider.Root>,
  )

  // Written after the component's own, so it wins over the default.
  expect(
    screen.getByTestId('track').style.getPropertyValue('--thickness'),
  ).toBe('16px')
})

test('the value of a custom property is a string or a number', () => {
  const ok: CSSVariables<'--gap'> = { '--gap': 4, '--other': '1rem' }
  // @ts-expect-error a custom property holds text, not an object
  const bad: CSSVariables<'--gap'> = { '--gap': { px: 4 } }
  expect([ok, bad]).toHaveLength(2)
})

test('a name without the leading dashes is still an unknown property', () => {
  const style: Parameters<typeof Slider.Track>[0]['style'] = {
    // @ts-expect-error `thickness` is a prop of the track, not a style
    thickness: '16px',
  }
  expect(style).toBeDefined()
})
