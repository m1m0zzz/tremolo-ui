import {
  AnimationCanvas,
  DropZone,
  FileInput,
  Knob,
  NumberInput,
  Piano,
  PointsEditor,
  Slider,
  XYPad,
} from '../src'

describe('React 18 ref support', () => {
  test.each([
    ['AnimationCanvas', AnimationCanvas],
    ['DropZone.Root', DropZone.Root],
    ['FileInput.Root', FileInput.Root],
    ['FileInput.Trigger', FileInput.Trigger],
    ['Knob.Root', Knob.Root],
    ['NumberInput.Root', NumberInput.Root],
    ['NumberInput.InputField', NumberInput.InputField],
    ['NumberInput.Stepper', NumberInput.Stepper],
    ['Piano.Root', Piano.Root],
    ['PointsEditor.Container', PointsEditor.Container],
    ['Slider.Root', Slider.Root],
    ['Slider.Track', Slider.Track],
    ['Slider.Thumb', Slider.Thumb],
    ['XYPad.Root', XYPad.Root],
    ['XYPad.Area', XYPad.Area],
    ['XYPad.Thumb', XYPad.Thumb],
  ])('%s uses forwardRef', (_name, component) => {
    expect(component).toHaveProperty(
      '$$typeof',
      Symbol.for('react.forward_ref'),
    )
  })
})
