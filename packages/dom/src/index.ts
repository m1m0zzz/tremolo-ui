// What users of the components and of this package write: the `create*`
// interactions, the values and types that show up in props, and the geometry a
// part of your own needs to draw. Everything here follows semver. What only
// the wrappers need is in `./internal`, which does not.
export {
  createAnimationCanvas,
  type AnimationCanvasInstance,
  type AnimationCanvasOptions,
  type AnimationFrame,
  type CanvasDrawFunction,
  type CanvasInitFunction,
} from './canvas/animation'
export {
  createDropZone,
  type DropZoneInstance,
  type DropZoneOptions,
  type DropZoneState,
} from './file/drop-zone'
export {
  createChangeGesture,
  type ChangeGestureInstance,
  type ChangeGestureOptions,
  type ChangeSource,
} from './input/change-gesture'
export {
  DEFAULT_DRAG_SENSITIVITY,
  DEFAULT_KEYBOARD_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
} from './input/defaults'
export {
  type InputEventOption,
  type Modifier,
  type ModifierMap,
  type ModifierState,
  type ModifierValue,
} from './input/modifiers'
export {
  KNOB_VIEWBOX_SIZE,
  knobAngles,
  knobArcPath,
  knobArcRadius,
  type KnobAngleOptions,
  type KnobAngles,
} from './knob/geometry'
export {
  createMIDIAccess,
  type MIDIAccessError,
  type MIDIAccessInstance,
  type MIDIAccessOptions,
  type MIDIAccessState,
} from './midi/access'
export {
  createMIDIInput,
  type MIDIInputHandlers,
  type MIDIInputInstance,
} from './midi/input'
export { createMIDIMessage, type MIDIMessageInstance } from './midi/message'
export { notePosition, type NoteRange, type PianoLayout } from './piano/layout'
export {
  SHORTCUTS,
  type KeyboardShortcuts,
  type KeyboardShortcutsScope,
} from './piano/shortcuts'
export {
  createPianoInput,
  type NoteSource,
  type PianoInputInstance,
  type PianoInputOptions,
} from './piano'
export {
  createPointsEditor,
  type PointPosition,
  type PointsEditorInstance,
  type PointsEditorOptions,
  type PointsEditorPoint,
} from './points-editor'
export {
  createDrag,
  type DragInstance,
  type DragOptions,
  type DragState,
} from './pointer/drag'
export {
  createDragValue,
  elementMapping,
  relativeMapping,
  type AxisOptions,
  type DragValueInstance,
  type DragValueMapping,
  type DragValueOptions,
  type MappingContext,
} from './pointer/drag-value'
export {
  createLongPress,
  type LongPressInstance,
  type LongPressOptions,
} from './pointer/long-press'
export {
  createWheel,
  type WheelInstance,
  type WheelOptions,
} from './pointer/wheel'
export { valuePercent } from './position'
export { type SelectionBoxRect } from './selection/box'
export { type MarksOptions } from './slider/marks'
export { type XY, type XYInput } from './xy'
