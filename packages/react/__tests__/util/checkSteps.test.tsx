import { render } from '@testing-library/react'

import { unitFormat } from '@tremolo-ui/functions'

import { Knob } from '../../src/components/Knob'
import { NumberInput } from '../../src/components/NumberInput'
import { Slider } from '../../src/components/Slider'
import { XYPad } from '../../src/components/XYPad'

let warn: jest.SpyInstance

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

/** Every warning printed, joined, so a message can be matched loosely. */
const warnings = () => warn.mock.calls.map(([m]) => String(m)).join('\n')

describe('a press that cannot move the value', () => {
  test('says nothing when the amount clears the step', () => {
    render(
      <Slider.Root value={50} min={0} max={100} step={1}>
        <Slider.Track>
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Root>,
    )

    expect(warn).not.toHaveBeenCalled()
  })

  test('warns when keyboard is finer than step', () => {
    render(
      <Slider.Root
        value={50}
        min={0}
        max={100}
        step={1}
        keyboard={['raw', 0.1]}
      >
        <Slider.Track>
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Root>,
    )

    expect(warnings()).toContain('Slider: `keyboard` cannot move the value')
    expect(warnings()).toContain('`step` (1)')
  })

  test('warns about the wheel separately', () => {
    render(
      <Knob.Root value={50} min={0} max={100} step={10} wheel={['raw', 1]}>
        <Knob.SVGRoot>
          <Knob.ActiveLine />
        </Knob.SVGRoot>
      </Knob.Root>,
    )

    expect(warnings()).toContain('Knob: `wheel` cannot move the value')
  })

  test('names the axis on a component that has two', () => {
    render(
      <XYPad.Root
        value={[50, 50]}
        min={[0, 0]}
        max={[100, 100]}
        step={[1, 1]}
        keyboard={['raw', 0.1]}
      >
        <XYPad.Area>
          <XYPad.Thumb />
        </XYPad.Area>
      </XYPad.Root>,
    )

    expect(warnings()).toContain('XYPad (x)')
    expect(warnings()).toContain('XYPad (y)')
  })

  test('a modifier entry is checked too', () => {
    render(
      <Slider.Root
        value={50}
        min={0}
        max={100}
        step={1}
        keyboard={{ default: ['raw', 1], shift: ['raw', 0.1] }}
      >
        <Slider.Track>
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Root>,
    )

    // The default entry moves, so the setting as a whole is not dead. A
    // modifier is a deliberate move off the grid, and `applyDelta` drops the
    // step for it — this pair is fine.
    expect(warn).not.toHaveBeenCalled()
  })

  test('a production build stays quiet', () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    try {
      render(
        <Slider.Root
          value={50}
          min={0}
          max={100}
          step={1}
          keyboard={['raw', 0.1]}
        >
          <Slider.Track>
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Root>,
      )

      expect(warn).not.toHaveBeenCalled()
    } finally {
      process.env.NODE_ENV = previous
    }
  })
})

describe('a press the display cannot show', () => {
  test('says nothing when the format keeps up', () => {
    render(
      <NumberInput.Root
        value={1000}
        min={20}
        max={20000}
        {...unitFormat('Hz', { digits: 2 })}
      >
        <NumberInput.InputField />
      </NumberInput.Root>,
    )

    expect(warn).not.toHaveBeenCalled()
  })

  test('warns when the format is too coarse everywhere', () => {
    render(
      <NumberInput.Root
        value={0.5}
        min={0}
        max={1}
        step={0.001}
        keyboard={['raw', 0.001]}
        format={(v) => v.toFixed(1)}
      >
        <NumberInput.InputField />
      </NumberInput.Root>,
    )

    expect(warnings()).toContain('NumberInput: `keyboard` moves the value')
    expect(warnings()).toContain('too coarse')
  })

  test('a display that only rounds is left alone', () => {
    // Two decimals of a value that carries three: most presses show, some do
    // not. That is what rounding a display is, and it is not a mistake.
    render(
      <NumberInput.Root
        value={0.5}
        min={0}
        max={1}
        step={0.001}
        keyboard={['raw', 0.01]}
        format={(v) => v.toFixed(2)}
      >
        <NumberInput.InputField />
      </NumberInput.Root>,
    )

    expect(warn).not.toHaveBeenCalled()
  })

  test('an unbounded input is not probed', () => {
    render(
      <NumberInput.Root value={0} format={(v) => v.toFixed(0)}>
        <NumberInput.InputField />
      </NumberInput.Root>,
    )

    expect(warn).not.toHaveBeenCalled()
  })
})
