// For bundled CSS (@tremolo-ui/react/styles/index.css)
import './styles/global.css'
import './components/Knob/index.css'
import './components/NumberInput/index.css'
import './components/Piano/index.css'
import './components/PointsEditor/index.css'
import './components/Slider/index.css'
import './components/XYPad/index.css'

export {
  AnimationCanvas,
  type AbsoluteSizingProps,
  type AnimationCanvasProps,
  type CommonProps,
  type DrawFunction,
  type InitFunction,
  type RelativeSizingProps,
} from './components/AnimationCanvas'
export { Knob, type KnobProps, type KnobMethods } from './components/Knob'
export {
  NumberInput,
  useNumberInputContext,
  type NumberInputProps,
  type NumberInputMethods,
  type NumberInputFieldProps,
  type StepperProps,
  type IncrementStepperProps,
  type DecrementStepperProps,
} from './components/NumberInput'
export {
  Piano,
  SHORTCUTS,
  type PianoProps,
  type PianoMethods,
  type KeyState,
  type KeyAttributes,
  type CSSVariables,
  type KeyboardShortcuts,
} from './components/Piano'
export {
  PointsEditor,
  clampPoint,
  type PointsEditorProps,
  type PointProps,
  type PointBaseType,
} from './components/PointsEditor'
export {
  Slider,
  useSliderContext,
  type MarksOptionProps,
  type MarksProps,
  type SliderMethods,
  type SliderProps,
  type SliderThumbMethods,
  type SliderThumbProps,
  type SliderTrackProps,
} from './components/Slider'
export {
  XYPad,
  type XYPadProps,
  type XYPadMethods,
  type XYPadAreaProps,
  type XYPadThumbProps,
  type XYPadThumbMethods,
  type XY,
  type XYInput,
} from './components/XYPad'

// hooks
export { useAnimationFrame } from './hooks/useAnimationFrame'
export { useDrag } from './hooks/useDrag'
export { useDragValue, type UseDragValueOptions } from './hooks/useDragValue'
export { useEventListener } from './hooks/useEventListener'
export { useInterval } from './hooks/useInterval'
export { useLongPress } from './hooks/useLongPress'
export {
  useMIDIAccess,
  NOT_SUPPORTED,
  PERMISSION_DENIED,
  type MIDIAccessError,
} from './hooks/useMIDIAccess'
export { useMIDIInput } from './hooks/useMIDIInput'
export { useMIDIMessage } from './hooks/useMIDIMessage'
export { useWheel } from './hooks/useWheel'
