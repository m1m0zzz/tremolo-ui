// For bundled CSS (@tremolo-ui/react/styles/index.css)
import './styles/global.css'
import './components/Knob/index.css'
import './components/NumberInput/index.css'
import './components/Piano/index.css'
import './components/Slider/index.css'
import './components/XYPad/index.css'

export {
  type AbsoluteSizingProps,
  AnimationCanvas,
  type AnimationCanvasProps,
  type CommonProps,
  type DrawFunction,
  type InitFunction,
  type RelativeSizingProps,
} from './components/AnimationCanvas'
export {
  AnimationKnob,
  type AnimationKnobMethods,
  type AnimationKnobProps,
} from './components/AnimationKnob'
export { DragObserver, type DragObserverProps } from './components/DragObserver'
export { Knob, type KnobMethods, type KnobProps } from './components/Knob'
export {
  DecrementStepper,
  type DecrementStepperProps,
  IncrementStepper,
  type IncrementStepperProps,
  NumberInput,
  type NumberInputMethods,
  type NumberInputProps,
  Stepper,
  type StepperProps,
} from './components/NumberInput'
export {
  Piano,
  type PianoProps,
  type PianoMethods,
  getNoteRangeArray,
  WhiteKey,
  BlackKey,
  type KeyProps,
  type KeyMethods,
  KeyLabel,
  type KeyLabelProps,
  SHORTCUTS,
  type KeyboardShortcuts,
} from './components/Piano'
export {
  Scale,
  ScaleOption,
  type ScaleOptionProps,
  type ScaleProps,
  Slider,
  type SliderMethods,
  type SliderProps,
  SliderThumb,
  type SliderThumbMethods,
  type SliderThumbProps,
  SliderTrack,
  type SliderTrackProps,
  useSliderContext,
} from './components/Slider'
export {
  WheelObserver,
  type WheelObserverProps,
} from './components/WheelObserver'
export {
  type AreaProps,
  type ThumbProps,
  type ValueOptions,
  XYPad,
  XYPadArea,
  type XYPadMethods,
  type XYPadProps,
  XYPadThumb,
  type XYPadThumbMethods,
} from './components/XYPad'

// hooks
export { useAnimationFrame } from './hooks/useAnimationFrame'
export { useDrag, type UseDragProps } from './hooks/useDrag'
export {
  useDragWithElement,
  type UseDragWithElementProps,
} from './hooks/useDragWithElement'
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
