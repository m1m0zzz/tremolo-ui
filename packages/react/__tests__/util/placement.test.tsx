import { render } from '@testing-library/react'

import { Knob } from '../../src/components/Knob'
import { PointsEditor } from '../../src/components/PointsEditor'
import { Slider } from '../../src/components/Slider'
import { XYPad } from '../../src/components/XYPad'

let warn: jest.SpyInstance
let error: jest.SpyInstance

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  // React complains about `<path>` outside an `<svg>`, which is the very thing
  // the Knob case is about. Kept out of the test output, and asserted on there.
  error = jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
  error.mockRestore()
})

/** Every warning printed, joined, so a message can be matched loosely. */
const warnings = () => warn.mock.calls.map(([m]) => String(m)).join('\n')

describe('subcomponent placement', () => {
  test('says nothing when everything is where it belongs', () => {
    render(
      <Slider.Root value={0} min={0} max={100}>
        <Slider.Track>
          <Slider.Thumb />
        </Slider.Track>
        <Slider.Marks>
          <Slider.MarksOption value={50} />
        </Slider.Marks>
      </Slider.Root>,
    )

    expect(warn).not.toHaveBeenCalled()
  })

  test('Slider.Thumb outside Slider.Track', () => {
    render(
      <Slider.Root value={0} min={0} max={100}>
        <Slider.Track />
        <Slider.Thumb />
      </Slider.Root>,
    )

    expect(warnings()).toContain(
      'Slider.Thumb has to be rendered inside Slider.Track',
    )
  })

  test('names the wrong parent when there is one', () => {
    render(
      <Slider.Root value={0} min={0} max={100}>
        <Slider.Track />
        <Slider.Marks>
          <Slider.Thumb />
        </Slider.Marks>
      </Slider.Root>,
    )

    expect(warnings()).toContain('but it is inside Slider.Marks')
  })

  test('Slider.MarksOption outside Slider.Marks', () => {
    render(
      <Slider.Root value={0} min={0} max={100}>
        <Slider.Track />
        <Slider.MarksOption value={50} />
      </Slider.Root>,
    )

    expect(warnings()).toContain(
      'Slider.MarksOption has to be rendered inside Slider.Marks',
    )
  })

  test('XYPad.Thumb outside XYPad.Area', () => {
    render(
      <XYPad.Root value={[0, 0]} min={0} max={100}>
        <XYPad.Area />
        <XYPad.Thumb />
      </XYPad.Root>,
    )

    expect(warnings()).toContain(
      'XYPad.Thumb has to be rendered inside XYPad.Area',
    )
  })

  test('the Knob lines and thumb outside Knob.SVGRoot', () => {
    render(
      <Knob.Root value={0} min={0} max={100}>
        <Knob.InactiveLine />
        <Knob.ActiveLine />
        <Knob.Thumb />
      </Knob.Root>,
    )

    const text = warnings()
    expect(text).toContain('Knob.InactiveLine has to be rendered inside')
    expect(text).toContain('Knob.ActiveLine has to be rendered inside')
    expect(text).toContain('Knob.Thumb has to be rendered inside')

    // React sees the same mistake, but only says the tag is unrecognized —
    // it cannot say which component was misplaced. (The message is a format
    // string, with the tag passed as an argument.)
    expect(error.mock.calls.flat().map(String).join('\n')).toContain(
      'The tag <%s> is unrecognized',
    )
  })

  test('PointsEditor.Point outside PointsEditor.Container', () => {
    render(
      <PointsEditor.Root>
        <PointsEditor.Point value={{ x: 0.5, y: 0.5 }} />
      </PointsEditor.Root>,
    )

    expect(warnings()).toContain(
      'PointsEditor.Point has to be rendered inside PointsEditor.Container',
    )
  })

  test('the warning says the component still renders', () => {
    render(
      <Slider.Root value={0} min={0} max={100}>
        <Slider.Track />
        <Slider.Thumb />
      </Slider.Root>,
    )

    expect(warnings()).toContain('nothing fails')
  })

  test('a production build stays quiet', () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    try {
      render(
        <Slider.Root value={0} min={0} max={100}>
          <Slider.Track />
          <Slider.Thumb />
        </Slider.Root>,
      )

      expect(warn).not.toHaveBeenCalled()
    } finally {
      process.env.NODE_ENV = previous
    }
  })
})
