/**
 * This is how you import top-level functions.
 *
 * ```ts
 * import { anyFunc } from '@tremolo-ui/functions'
 * ```
 * @module top-level
 */

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
