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
export {
  AnimationKnob,
  type AnimationKnobProps,
  type AnimationKnobMethods,
} from './components/AnimationKnob'
export { DragObserver, type DragObserverProps } from './components/DragObserver'
export { Knob, type KnobProps, type KnobMethods } from './components/Knob'
export {
  NumberInput,
  type NumberInputProps,
  type NumberInputMethods,
  type StepperProps,
  type IncrementStepperProps,
  type DecrementStepperProps,
} from './components/NumberInput'
export {
  Piano,
  getNoteRangeArray,
  SHORTCUTS,
  type PianoProps,
  type PianoMethods,
  type KeyProps,
  type KeyMethods,
  type KeyLabelProps,
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
  type ScaleOptionProps,
  type ScaleProps,
  type SliderMethods,
  type SliderProps,
  type SliderThumbMethods,
  type SliderThumbProps,
  type SliderTrackProps,
} from './components/Slider'
export {
  WheelObserver,
  type WheelObserverProps,
} from './components/WheelObserver'
export {
  XYPad,
  type XYPadProps,
  type XYPadMethods,
  type XYPadAreaProps,
  type XYPadThumbProps,
  type XYPadThumbMethods,
  type ValueOptions,
} from './components/XYPad'

// hooks
export { useAnimationFrame } from './hooks/useAnimationFrame'
export { useDrag } from './hooks/useDrag'
export { useDragWithElement } from './hooks/useDragWithElement'
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
