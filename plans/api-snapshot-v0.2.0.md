# 公開 API スナップショット (v0.2.0)

コア切り出し（`plans/core-extranction-plan.md`）で `@tremolo-ui/react` に破壊的変更を入れる前の状態。
移行後に差分を説明するための基準として残す。

取得コミット: `bdbad60`
- `@tremolo-ui/functions`: 0.2.0
- `@tremolo-ui/react`: 0.2.0

## `@tremolo-ui/functions`

```ts
export {
  clamp,
  dbToGain,
  decimalPart,
  degree,
  gainToDb,
  integerPart,
  mapValue,
  normalizeValue,
  radian,
  rawValue,
  skewWithCenterValue,
  stepValue,
  toFixed,
} from './math'
export {
  type NoteKey,
  type WhiteKey,
  isBlackKey,
  isWhiteKey,
  noteKey,
  noteKeys,
  noteName,
  noteNumber,
  noteToFrequency,
  parseNoteName,
  whiteKeys,
} from './midi'
export { type InputEventOption } from './types'
export { isEmpty, mod, styleHelper, xor } from './util'
```

## `@tremolo-ui/react`

```ts
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
```

## `@tremolo-ui/react` の `exports` マップ

```json
{
  ".": {
    "require": {
      "types": "./dist/index.d.cts",
      "default": "./dist/index.cjs"
    },
    "import": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "./styles/index.css": "./dist/index.css",
  "./styles/global.css": "./src/styles/global.css",
  "./styles/Knob.css": "./src/components/Knob/index.css",
  "./styles/NumberInput.css": "./src/components/NumberInput/index.css",
  "./styles/Piano.css": "./src/components/Piano/index.css",
  "./styles/PointsEditor.css": "./src/components/PointsEditor/index.css",
  "./styles/Slider.css": "./src/components/Slider/index.css",
  "./styles/XYPad.css": "./src/components/XYPad/index.css"
}
```
