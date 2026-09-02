import { render } from '@testing-library/react'

import { Knob } from '../../src/components/Knob'

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
  test('leaves the inline size unset so the CSS default applies', () => {
    const knob = renderKnob()
    expect(knob.style.width).toBe('')
    expect(knob.style.height).toBe('')
  })

  test('the size prop overrides it', () => {
    const knob = renderKnob(30)
    expect(knob.style.width).toBe('30px')
    expect(knob.style.height).toBe('30px')
  })
})
