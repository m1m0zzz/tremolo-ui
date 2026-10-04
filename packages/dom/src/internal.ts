// What the wrappers in this repository share and nothing else is meant to
// call. Not covered by semver: anything here can change in any release. The
// wrappers depend on this package at the exact version for that reason.
export { partitionByAccept, type AcceptCandidate } from './file/accept'
export { applyDelta } from './input/apply-delta'
export { checkSteps, type CheckStepsOptions } from './input/check-steps'
export {
  arrowKeyDirection,
  arrowKeyMove,
  wheelDirection,
  wheelMove,
  type AxisMove,
  type WheelDirectionOptions,
} from './input/direction'
export { selectModifier } from './input/modifiers'
export {
  createStepperDrag,
  type StepperDragInstance,
  type StepperDragOptions,
} from './number-input/stepper-drag'
export {
  commitNumberInputText,
  numberInputBounds,
  numberInputRanges,
  nudgeNumberInput,
  type NumberInputRanges,
  type NumberInputValueOptions,
} from './number-input/value'
export {
  caretAtDecimalOffset,
  caretDecimalOffset,
  numberSpan,
  parseNumberText,
  type NumberSpan,
} from './number-input/text'
export { replaceOptions } from './options/replace'
export {
  blackKeyWidth,
  fitWhiteKeyWidth,
  getNoteRangeArray,
  pianoWidth,
} from './piano/layout'
export {
  clampPoint,
  POINT_AXIS,
  POINTS_EDITOR_DEFAULT_KEYBOARD,
  POINTS_EDITOR_DEFAULT_WHEEL,
} from './points-editor'
export { sliderMarks, type SliderMark } from './slider/marks'
export { cssLength, visuallyHiddenStyle } from './style'
export { toXY } from './xy'
