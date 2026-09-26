// actions
export { drag } from './actions/drag.js'
export { dragValue } from './actions/drag-value.js'
export { dropZone } from './actions/drop-zone.js'
export { longPress } from './actions/long-press.js'
export { wheel, type WheelActionOptions } from './actions/wheel.js'

// components
export * as Knob from './components/Knob/index.js'
export {
  useKnobContext,
  type KnobContextValue,
} from './components/Knob/context.js'
export type { KnobProps, KnobThumbProps } from './components/Knob/types.js'
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

// hooks
export { useMIDIAccess } from './hooks/useMIDIAccess.svelte.js'
export { useMIDIInput } from './hooks/useMIDIInput.svelte.js'
export { useMIDIMessage } from './hooks/useMIDIMessage.svelte.js'
