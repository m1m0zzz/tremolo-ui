import { render } from '@testing-library/react'

import { Knob } from '.'

function renderKnob(size?: number) {
  const { container } = render(
    <Knob.Root value={50} min={0} max={100} size={size}>
      <Knob.SVGRoot>
        <Knob.InactiveLine />
        <Knob.ActiveLine />
        <Knob.Thumb />
      </Knob.SVGRoot>
    </Knob.Root>,
  )
  return container.querySelector('.tremolo-knob') as HTMLElement
}

describe('Knob size', () => {
  // Without a size the element used to collapse, because width and height were
  // set to undefined and the SVG has no intrinsic size. The default now lives
  // in the CSS as --knob-size.
  test('leaves the variable unset so the CSS default applies', () => {
    const knob = renderKnob()
    expect(knob.style.getPropertyValue('--knob-size')).toBe('')
  })

  test('the size prop overrides it', () => {
    const knob = renderKnob(30)
    // A unit is added here: React only appends `px` to properties it knows
    // take a length, and a custom property is never one of them.
    expect(knob.style.getPropertyValue('--knob-size')).toBe('30px')
  })

  test('a string is passed through as written', () => {
    const { container } = render(
      <Knob.Root value={50} min={0} max={100} size="3rem">
        <Knob.SVGRoot>
          <Knob.Thumb />
        </Knob.SVGRoot>
      </Knob.Root>,
    )
    const knob = container.querySelector('.tremolo-knob') as HTMLElement
    expect(knob.style.getPropertyValue('--knob-size')).toBe('3rem')
  })
})
