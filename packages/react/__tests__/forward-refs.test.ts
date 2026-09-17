import {
  AnimationCanvas,
  DropZone,
  FileInput,
  NumberInput,
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
    ['NumberInput.InputField', NumberInput.InputField],
    ['NumberInput.Stepper', NumberInput.Stepper],
    ['PointsEditor.Container', PointsEditor.Container],
    ['Slider.Track', Slider.Track],
    ['Slider.Thumb', Slider.Thumb],
    ['XYPad.Area', XYPad.Area],
    ['XYPad.Thumb', XYPad.Thumb],
  ])('%s uses forwardRef', (_name, component) => {
    expect(component).toHaveProperty(
      '$$typeof',
      Symbol.for('react.forward_ref'),
    )
  })
})
