import { toPrecision } from './math'

/**
 * The SI prefixes {@link unitFormat} chooses between.
 *
 * Deliberately narrower than the full SI set: yocto through yotta are of no
 * use to an audio control, and every extra prefix is one more symbol `parse`
 * has to tell apart from a unit.
 */
export type SIPrefix = 'p' | 'n' | 'µ' | 'm' | '' | 'k' | 'M' | 'G'

/** Ordered small to large. The empty symbol is the base unit. */
const PREFIXES: readonly [SIPrefix, number][] = [
  ['p', 1e-12],
  ['n', 1e-9],
  ['µ', 1e-6],
  ['m', 1e-3],
  ['', 1],
  ['k', 1e3],
  ['M', 1e6],
  ['G', 1e9],
]

const PREFIX_SCALE = new Map<string, number>(PREFIXES)

/**
 * Micro is written three ways. `µ` (U+00B5 MICRO SIGN) is what `format`
 * writes and what d3-format uses, `μ` (U+03BC GREEK SMALL LETTER MU) looks
 * identical and is what a Greek keyboard produces, and `u` is what everyone
 * actually types. All three read back the same.
 */
const MICRO_ALIASES: Record<string, SIPrefix> = { μ: 'µ', u: 'µ' }

export interface UnitFormatOptions {
  /**
   * The prefix the stored value is already in.
   *
   * A control that keeps milliseconds in `value` is `{ base: 'm' }` with a
   * unit of `'s'`: 1500 then displays as `1.5s`, and `parse` gives 1500 back.
   *
   * @default ''
   */
  base?: SIPrefix
  /**
   * Whether to scale the number and pick a prefix at all.
   *
   * Turn it off for anything that is not an SI quantity. dB, %, cents and
   * semitones do not take prefixes, and `-6dB` read as "-6 deci-B" is wrong
   * rather than merely unusual.
   *
   * @default true
   */
  prefixes?: boolean
  /**
   * Digits after the decimal point. The number is left as-is when omitted.
   */
  digits?: number
  /**
   * Text placed between the number and the unit.
   * @default ''
   */
  separator?: string
}

/** The `format` / `parse` pair a `NumberInput` takes. */
export interface UnitFormatter {
  format: (value: number) => string
  parse: (text: string) => number
}

/**
 * Divide by a prefix scale without showing the result of doing so in binary.
 *
 * `0.0005 / 1e-6` is 500.00000000000006, and with no `digits` to round it that
 * lands in the input as written.
 */
function scaleBy(value: number, scale: number): number {
  return toPrecision(value / scale)
}

/** A number, then whatever followed it. */
const NUMBER_THEN_REST =
  /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*(.*)$/

/**
 * Build the `format` and `parse` of a unit, as one pair.
 *
 * They are returned together because they have to agree: a `format` that
 * writes `1.23kHz` is only useful next to a `parse` that reads it back as
 * 1230. Spread the result into the input.
 *
 * @example
 * unitFormat('Hz')                                 // 1234 -> '1.23kHz'
 * unitFormat('s', { base: 'm' })                   // value in ms. 1500 -> '1.5s'
 * unitFormat('s', { base: 'm', digits: 2 })        // 1500 -> '1.50s'
 * unitFormat('dB', { prefixes: false, digits: 1 }) // -6.25 -> '-6.3dB'
 *
 * @example
 * <NumberInput.Root {...unitFormat('Hz', { digits: 2 })} value={v} onChange={setV}>
 */
export function unitFormat(
  unit: string,
  options: UnitFormatOptions = {},
): UnitFormatter {
  const { base = '', prefixes = true, digits, separator = '' } = options
  if (unit === '' && base !== '') {
    throw new RangeError('unitFormat: base requires a non-empty unit')
  }
  const baseScale = PREFIX_SCALE.get(base) ?? 1

  /**
   * `toFixed` renders anything that rounds to zero from below as `-0`, which
   * is never what a control should show.
   */
  const fixed = (value: number) => {
    const text = digits !== undefined ? value.toFixed(digits) : String(value)
    return Number(text) === 0 ? text.replace('-', '') : text
  }

  if (!prefixes) {
    // The stored value goes out untouched, so the symbol has to name the unit
    // it is already in.
    const symbol = base + unit
    return {
      format: (value) =>
        Number.isFinite(value)
          ? fixed(value) + separator + symbol
          : String(value),
      // Nothing after the number can change the scale, so it is all ignored:
      // the number in front is the value, half-typed or not.
      parse: (text) => {
        const match = text.trim().match(NUMBER_THEN_REST)
        if (!match) return NaN
        const value = Number(match[1])
        return Number.isFinite(value) ? value : NaN
      },
    }
  }

  return {
    format: (value) => {
      if (!Number.isFinite(value)) return String(value)
      const si = value * baseScale
      // Zero has no magnitude to read, so it stays in the base unit.
      let index = PREFIXES.findIndex(([, scale]) => scale === 1)
      if (si !== 0) {
        // The largest prefix that leaves at least one digit before the point.
        // Below the smallest prefix the number just gets small: `p` is the
        // floor, as `G` is the ceiling.
        const magnitude = Math.abs(si)
        index = 0
        for (let i = PREFIXES.length - 1; i >= 0; i--) {
          if (magnitude >= PREFIXES[i][1]) {
            index = i
            break
          }
        }
      }
      let text = fixed(scaleBy(si, PREFIXES[index][1]))
      // Rounding can carry the number up out of its own prefix — 999.99Hz at
      // one digit is 1000.0Hz, which should read 1.0kHz. One step is always
      // enough, since the carry is at most a factor of ten.
      if (Math.abs(Number(text)) >= 1000 && index < PREFIXES.length - 1) {
        index += 1
        text = fixed(scaleBy(si, PREFIXES[index][1]))
      }
      return text + separator + PREFIXES[index][0] + unit
    },

    parse: (text) => {
      const match = text.trim().match(NUMBER_THEN_REST)
      if (!match) return NaN
      const number = Number(match[1])
      if (!Number.isFinite(number)) return NaN

      let suffix = match[2].trim()
      const separatorText = separator.trim()
      if (separatorText !== '' && suffix.startsWith(separatorText)) {
        suffix = suffix.slice(separatorText.length).trim()
      }
      // A bare number is in the unit the value is stored in, which is what
      // the input shows once the format is stripped.
      if (suffix === '') return number

      // The unit symbol is matched first, so a unit that is itself a prefix
      // letter wins over the prefix reading: `5m` for a unit of `m` is five
      // metres, not five milli-.
      let prefix: string | null = null
      if (unit !== '' && suffix.endsWith(unit)) {
        prefix = suffix.slice(0, suffix.length - unit.length)
      } else if (suffix.length <= 1) {
        prefix = suffix
      }
      if (prefix === null) return number

      const normalized = MICRO_ALIASES[prefix] ?? prefix
      const scale = PREFIX_SCALE.get(normalized)
      // Unrecognised text after the number is ignored rather than rejected,
      // so that a half-typed entry still yields the number in front of it.
      if (scale === undefined) return number
      return (number * scale) / baseScale
    },
  }
}
