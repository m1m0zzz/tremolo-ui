export {
  AnimationCanvas,
  type AnimationCanvasCommonProps,
  type AnimationCanvasFixedProps,
  type AnimationCanvasProps,
  type AnimationCanvasResizableProps,
  type DrawFunction,
  type InitFunction,
} from './components/AnimationCanvas'
export { DropZone, type DropZoneProps } from './components/DropZone'
export {
  FileInput,
  useFileInputContext,
  type FileInputContextValue,
  type FileInputProps,
  type FileInputTriggerProps,
} from './components/FileInput'
export {
  Knob,
  useKnobContext,
  type KnobContextValue,
  type KnobProps,
  type KnobMethods,
  type KnobSVGRootProps,
  type KnobThumbProps,
} from './components/Knob'
export {
  NumberInput,
  useNumberInputContext,
  type NumberInputContextValue,
  type NumberInputProps,
  type NumberInputMethods,
} from './components/NumberInput'
export {
  Piano,
  type PianoProps,
  type PianoMethods,
  type KeyState,
  type KeyAttributes,
} from './components/Piano'
export {
  PointsEditor,
  usePointsEditorContext,
  clampPoint,
  type PointsEditorProps,
  type PointsEditorContextValue,
  type PointsEditorPointProps,
  type PointBaseType,
} from './components/PointsEditor'
export {
  Slider,
  useSliderContext,
  type SliderContextValue,
  type SliderMarksOptionProps,
  type SliderMarksProps,
  type SliderMethods,
  type SliderProps,
  type SliderThumbMethods,
  type SliderThumbProps,
  type SliderTrackProps,
} from './components/Slider'
export {
  XYPad,
  useXYPadContext,
  type XYPadContextValue,
  type XYPadProps,
  type XYPadMethods,
  type XYPadThumbProps,
  type XYPadThumbMethods,
} from './components/XYPad'

export { type CSSVariables } from './css-variables'

// hooks
export { useAnimationFrame } from './hooks/useAnimationFrame'
export { useDrag, type UseDragOptions } from './hooks/useDrag'
export { useDragValue, type UseDragValueOptions } from './hooks/useDragValue'
export { useDropZone, type UseDropZoneOptions } from './hooks/useDropZone'
export { useEventListener } from './hooks/useEventListener'
export { useInterval } from './hooks/useInterval'
export { useLongPress } from './hooks/useLongPress'
export { useMIDIAccess } from './hooks/useMIDIAccess'
export { useMIDIInput } from './hooks/useMIDIInput'
export { useMIDIMessage } from './hooks/useMIDIMessage'
export { useWheel, type UseWheelOptions } from './hooks/useWheel'
