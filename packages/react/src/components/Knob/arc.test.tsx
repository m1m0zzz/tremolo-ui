import { render } from '@testing-library/react'

import { Knob } from '.'

describe('Knob arcs', () => {
  test.each([
    ['active', 100, '.tremolo-knob-active-line'],
    ['inactive', 0, '.tremolo-knob-inactive-line'],
  ])(
    'draws a full-circle %s line as two arc segments',
    (_name, value, line) => {
      const { container } = render(
        <Knob.Root value={value} min={0} max={100} angleRange={360}>
          <Knob.SVGRoot>
            <Knob.ActiveLine />
            <Knob.InactiveLine />
          </Knob.SVGRoot>
        </Knob.Root>,
      )

      const path = container.querySelector(line)?.getAttribute('d') ?? ''
      expect(path.match(/ A /g)).toHaveLength(2)
    },
  )
})
