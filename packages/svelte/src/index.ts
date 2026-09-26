// actions
export { drag } from './actions/drag.js'
export { dragValue } from './actions/drag-value.js'
export { dropZone } from './actions/drop-zone.js'
export { longPress } from './actions/long-press.js'
export { wheel, type WheelActionOptions } from './actions/wheel.js'

// components
export { default as AnimationCanvas } from './components/AnimationCanvas/AnimationCanvas.svelte'
export type {
  AnimationCanvasProps,
  DrawFunction,
  InitFunction,
} from './components/AnimationCanvas/types.js'
export * as DropZone from './components/DropZone/index.js'
export type { DropZoneProps } from './components/DropZone/types.js'
export * as FileInput from './components/FileInput/index.js'
export {
  useFileInputContext,
  type FileInputContextValue,
} from './components/FileInput/context.js'
export type { FileInputProps } from './components/FileInput/types.js'
export * as Knob from './components/Knob/index.js'
export {
  useKnobContext,
  type KnobContextValue,
} from './components/Knob/context.js'
export type { KnobProps, KnobThumbProps } from './components/Knob/types.js'
export * as NumberInput from './components/NumberInput/index.js'
export {
  useNumberInputContext,
  type NumberInputContextValue,
} from './components/NumberInput/context.js'
export type { NumberInputProps } from './components/NumberInput/types.js'
export * as Piano from './components/Piano/index.js'
export type {
  KeyAttributes,
  KeyState,
  PianoProps,
} from './components/Piano/types.js'
export * as PointsEditor from './components/PointsEditor/index.js'
export {
  usePointsEditorContext,
  type PointsEditorContextValue,
} from './components/PointsEditor/context.js'
export type {
  PointsEditorPointProps,
  PointsEditorProps,
} from './components/PointsEditor/types.js'
export * as Slider from './components/Slider/index.js'
export {
  useSliderContext,
  type SliderContextValue,
} from './components/Slider/context.js'
export type {
  SliderMarksOptionProps,
  SliderMarksProps,
  SliderProps,
  SliderThumbProps,
  SliderTrackProps,
} from './components/Slider/types.js'
export * as XYPad from './components/XYPad/index.js'
export {
  useXYPadContext,
  type XYPadContextValue,
} from './components/XYPad/context.js'
export type { XYPadProps, XYPadThumbProps } from './components/XYPad/types.js'

// hooks
export { useMIDIAccess } from './hooks/useMIDIAccess.svelte.js'
export { useMIDIInput } from './hooks/useMIDIInput.svelte.js'
export { useMIDIMessage } from './hooks/useMIDIMessage.svelte.js'
