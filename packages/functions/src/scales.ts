import { clamp, normalizeValue, rawValue } from './math'

/**
 * How a value is distributed across the travel of a control.
 *
 * `normalize` and `denormalize` are inverses of each other: the position is
 * 0 at `min` and 1 at `max`, and everything in between is up to the scale.
 *
 * `min` and `max` are arguments rather than baked into the scale, so a scale
 * holds no state and can be a module level constant. Passing the same object
 * on every render therefore costs nothing.
 *
 * @example
 * ```ts
 * exponentialScale.denormalize(0.5, 20, 20000) // 632.45…
 * ```
 */
export interface Scale {
  /** Value to its position on the travel, 0-1. */
  normalize: (value: number, min: number, max: number) => number
  /** Position on the travel, 0-1, back to a value. */
  denormalize: (position: number, min: number, max: number) => number
}

function assertRange(min: number, max: number) {
  if (min >= max) throw new RangeError('requirements: min < max')
}

function assertPositiveFinite(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name}: requirements: finite and greater than 0`)
  }
}

/**
 * Equal travel gives an equal change in value.
 *
 * The right default for anything already linear in perception: dB values,
 * pan, percentages, MIDI note numbers, semitones.
 */
export const linearScale: Scale = {
  normalize: (value, min, max) => normalizeValue(value, min, max),
  denormalize: (position, min, max) => rawValue(position, min, max),
}

/**
 * The power law of JUCE's `NormalisableRange::skew`, applied to `value - min`.
 *
 * Use it when the value has to agree with a JUCE or iPlug2 parameter — a
 * plugin UI in a WebView, say, where the knob must sit exactly where the
 * host's automation curve puts it. {@link skewWithCenterValue} gives the
 * factor that places a chosen value at the middle of the travel.
 *
 * `skew < 1` gives the lower end more travel, `skew > 1` the upper end.
 *
 * For new designs prefer {@link exponentialScale} or {@link curveScale}: the
 * slope of this curve is either zero or infinite at `min`, so the bottom of
 * the range is a dead zone or jumps.
 *
 * @param skew the JUCE skew factor
 */
export function skewScale(skew: number): Scale {
  assertPositiveFinite(skew, 'skewScale')
  return {
    // The two expressions JUCE uses, kept verbatim so the numbers agree with
    // a NormalisableRange: pow() one way, exp(log()) the other.
    normalize: (value, min, max) =>
      Math.pow(normalizeValue(value, min, max), skew),
    denormalize: (position, min, max) =>
      rawValue(
        skew === 1
          ? position
          : Math.exp(Math.log(clamp(position, 0, 1)) / skew),
        min,
        max,
      ),
  }
}

/**
 * The skew factor for {@link skewScale} that puts `centerValue` at the middle
 * of the travel — JUCE's `NormalisableRange::setSkewForCentre`.
 */
export function skewWithCenterValue(
  centerValue: number,
  min: number,
  max: number,
) {
  assertRange(min, max)
  if (!(min < centerValue && centerValue < max))
    throw new RangeError('requirements: min < centerValue < max')
  return Math.log(0.5) / Math.log((centerValue - min) / (max - min))
}

/**
 * Equal travel gives an equal *ratio*, so an octave — or a percentage — takes
 * the same distance wherever it falls.
 *
 * The scale for frequency (a filter cutoff over 20-20000 Hz), free running
 * rates, and delay times.
 *
 * Requires `min` and `max` to be non-zero and of the same sign, since no
 * ratio reaches zero or crosses it. Use {@link curveScale} for a range that
 * starts at 0.
 */
export const exponentialScale: Scale = {
  normalize: (value, min, max) => {
    assertExponentialRange(min, max)
    // The value is clamped before the logarithm, not after: outside the range
    // the ratio can be negative, and log() would give NaN rather than a
    // position to clamp.
    const start = Math.log(Math.abs(min))
    const end = Math.log(Math.abs(max))
    return clamp(
      (Math.log(Math.abs(clamp(value, min, max))) - start) / (end - start),
      0,
      1,
    )
  },
  denormalize: (position, min, max) => {
    assertExponentialRange(min, max)
    const start = Math.log(Math.abs(min))
    const end = Math.log(Math.abs(max))
    const magnitude = Math.exp(start + (end - start) * clamp(position, 0, 1))
    return Math.sign(min) * magnitude
  },
}

function assertExponentialRange(min: number, max: number) {
  assertRange(min, max)
  if (min === 0 || max === 0 || Math.sign(min) !== Math.sign(max)) {
    throw new RangeError(
      'exponentialScale: requirements: min and max are non-zero and have the same sign',
    )
  }
}

/**
 * An exponential bend that still passes exactly through `min` and `max`, so
 * unlike {@link exponentialScale} it works on a range that starts at 0 or
 * crosses it, and unlike {@link skewScale} its slope is neither zero nor
 * infinite at either end.
 *
 * The general purpose taper, and the same family as the curve of an envelope
 * segment (SuperCollider's `CurveWarp`).
 *
 * - `curve > 0` gives the lower end more travel — envelope times from 0 ms,
 *   delay times, anything that wants fine control near the bottom
 * - `curve < 0` gives the upper end more travel — a volume fader over
 *   -60..+6 dB that should be precise around 0 dB
 * - near 0 it is indistinguishable from {@link linearScale}, and is treated
 *   as linear to avoid dividing by zero
 *
 * {@link curveWithCenterValue} gives the curve that places a chosen value at
 * the middle of the travel.
 *
 * @param curve how hard the curve bends, and in which direction
 */
export function curveScale(curve: number): Scale {
  // Beyond this the flatter half of the curve no longer has enough distinct
  // double values for normalize and denormalize to remain inverses.
  if (!Number.isFinite(curve) || Math.abs(curve) > 32) {
    throw new RangeError(
      'curveScale: requirements: finite curve from -32 to 32',
    )
  }
  // The two coefficients blow up as the curve flattens: `a` divides by
  // 1 - e^curve, which goes to 0.
  if (Math.abs(curve) < 0.001) return linearScale

  return {
    normalize: (value, min, max) => {
      assertRange(min, max)
      const proportion = clamp((value - min) / (max - min), 0, 1)
      if (proportion === 0 || proportion === 1) return proportion
      if (curve > 0) {
        return (
          1 + Math.log(proportion + (1 - proportion) * Math.exp(-curve)) / curve
        )
      }
      return Math.log1p(proportion * Math.expm1(curve)) / curve
    },
    denormalize: (position, min, max) => {
      assertRange(min, max)
      const p = clamp(position, 0, 1)
      if (p === 0) return min
      if (p === 1) return max
      const proportion =
        curve > 0
          ? (Math.exp(curve * (p - 1)) * (1 - Math.exp(-curve * p))) /
            (1 - Math.exp(-curve))
          : Math.expm1(curve * p) / Math.expm1(curve)
      return min + (max - min) * proportion
    },
  }
}

/**
 * {@link skewScale} mirrored about the middle of the range, so both halves
 * bend the same way — JUCE's `symmetricSkew`.
 *
 * For a bipolar control whose centre matters: detune over -100..+100 cents,
 * or a bipolar filter envelope amount, where the fine adjustment is around 0
 * rather than at either end.
 *
 * `skew < 1` gives the middle more travel, `skew > 1` the two ends.
 *
 * @param skew the JUCE skew factor
 */
export function symmetricSkewScale(skew: number): Scale {
  assertPositiveFinite(skew, 'symmetricSkewScale')
  return {
    normalize: (value, min, max) => {
      assertRange(min, max)
      const proportion = clamp((value - min) / (max - min), 0, 1)
      if (skew === 1) return proportion
      const distanceFromMiddle = 2 * proportion - 1
      return (
        (1 +
          Math.pow(Math.abs(distanceFromMiddle), skew) *
            Math.sign(distanceFromMiddle)) /
        2
      )
    },
    denormalize: (position, min, max) => {
      assertRange(min, max)
      const p = clamp(position, 0, 1)
      let distanceFromMiddle = 2 * p - 1
      if (skew !== 1 && distanceFromMiddle !== 0) {
        distanceFromMiddle =
          Math.pow(Math.abs(distanceFromMiddle), 1 / skew) *
          Math.sign(distanceFromMiddle)
      }
      return min + ((max - min) / 2) * (1 + distanceFromMiddle)
    },
  }
}

/**
 * The curve for {@link curveScale} that puts `centerValue` at the middle of
 * the travel — the counterpart of {@link skewWithCenterValue}.
 */
export function curveWithCenterValue(
  centerValue: number,
  min: number,
  max: number,
) {
  assertRange(min, max)
  if (!(min < centerValue && centerValue < max)) {
    throw new RangeError('requirements: min < centerValue < max')
  }
  // value(0.5) - min = range / (1 + e^(curve / 2))
  const proportion = (centerValue - min) / (max - min)
  return 2 * Math.log(1 / proportion - 1)
}

/**
 * How a value is scaled: the range it lives in, how it is rounded, and how it
 * is distributed across the travel.
 *
 * `AxisOptions` of `@tremolo-ui/dom` extends this, so a drag and a
 * wheel / keyboard nudge run the same value pipeline.
 */
export interface ValueRange {
  min: number
  max: number
  /**
   * Rounding applied to the value. Left unrounded when omitted.
   */
  step?: number
  /**
   * How the value is distributed across the travel.
   *
   * @default linearScale
   */
  scale?: Scale
}
