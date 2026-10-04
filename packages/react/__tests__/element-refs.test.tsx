import { render } from '@testing-library/react'
import { createRef, type ReactElement, type RefObject } from 'react'

import { Knob, NumberInput, Piano, Slider, XYPad } from '../src'

// `ref` reaches the element a part renders; methods go through `actionsRef`.
// Before, these refs were objects of methods and never reached an element.
test.each<[string, (ref: RefObject<HTMLDivElement | null>) => ReactElement]>([
  [
    'Knob.Root',
    (ref) => (
      <Knob.Root ref={ref} value={0} min={0} max={1}>
        <Knob.SVGRoot>
          <Knob.Thumb />
        </Knob.SVGRoot>
      </Knob.Root>
    ),
  ],
  [
    'Slider.Root',
    (ref) => (
      <Slider.Root ref={ref} value={0} min={0} max={1}>
        <Slider.Track />
      </Slider.Root>
    ),
  ],
  [
    'Slider.Thumb',
    (ref) => (
      <Slider.Root value={0} min={0} max={1}>
        <Slider.Track>
          <Slider.Thumb ref={ref} />
        </Slider.Track>
      </Slider.Root>
    ),
  ],
  [
    'XYPad.Root',
    (ref) => (
      <XYPad.Root ref={ref} value={[0, 0]} min={0} max={1}>
        <XYPad.Area />
      </XYPad.Root>
    ),
  ],
  [
    'XYPad.Thumb',
    (ref) => (
      <XYPad.Root value={[0, 0]} min={0} max={1}>
        <XYPad.Area>
          <XYPad.Thumb ref={ref} />
        </XYPad.Area>
      </XYPad.Root>
    ),
  ],
  [
    'NumberInput.Root',
    (ref) => (
      <NumberInput.Root ref={ref} value={0}>
        <NumberInput.InputField />
      </NumberInput.Root>
    ),
  ],
  [
    'Piano.Root',
    (ref) => <Piano.Root ref={ref} noteRange={{ first: 60, last: 72 }} />,
  ],
])('%s gives ref its element', (_name, subject) => {
  const ref = createRef<HTMLDivElement>()
  render(subject(ref))
  expect(ref.current).toBeInstanceOf(HTMLDivElement)
})
