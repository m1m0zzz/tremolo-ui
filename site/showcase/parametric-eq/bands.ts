import { exponentialScale, linearScale } from '@tremolo-ui/functions'

export type BandType =
  | 'lowshelf'
  | 'peaking'
  | 'highshelf'
  | 'lowpass'
  | 'highpass'
  | 'notch'

export interface Band {
  type: BandType
  /** Hz */
  frequency: number
  /** dB. Only the bell and the shelves have one. */
  gain: number
  /** The quality factor, as the knob shows it. The shelves have none. */
  q: number
  /** Off, the band is left out of the chain and out of the curve. */
  enabled: boolean
  color: string
}

/** What each type is called, and which of the parameters it has. */
export const TYPES: Record<
  BandType,
  { label: string; gain: boolean; q: boolean }
> = {
  peaking: { label: 'Bell', gain: true, q: true },
  lowshelf: { label: 'Low shelf', gain: true, q: false },
  highshelf: { label: 'High shelf', gain: true, q: false },
  lowpass: { label: 'Low pass', gain: false, q: true },
  highpass: { label: 'High pass', gain: false, q: true },
  notch: { label: 'Notch', gain: false, q: true },
}

/**
 * The Q a band starts with, and goes back to on a double click on the knob:
 * one for every bell, and the flat Butterworth response for the passes.
 */
export const DEFAULT_Q: Record<BandType, number> = {
  peaking: 1,
  notch: 1,
  lowshelf: 1,
  highshelf: 1,
  lowpass: 0.71,
  highpass: 0.71,
}

export const FREQ_MIN = 20
export const FREQ_MAX = 20_000
export const GAIN_MIN = -18
export const GAIN_MAX = 18
export const Q_MIN = 0.1
export const Q_MAX = 18

/** Octaves are what the ear hears as equal steps, so frequency is logarithmic. */
export const freqScale = exponentialScale
export const gainScale = linearScale

/** Every band starts flat: 0 dB, the Q of its type, and on. */
const makeBand = (type: BandType, frequency: number, color: string): Band => ({
  type,
  frequency,
  gain: 0,
  q: DEFAULT_Q[type],
  enabled: true,
  color,
})

export const INITIAL_BANDS: Band[] = [
  makeBand('highpass', 30, '#ff6b6b'),
  makeBand('lowshelf', 100, '#ff9f5a'),
  makeBand('peaking', 250, '#ffd166'),
  makeBand('peaking', 600, '#7bd88f'),
  makeBand('peaking', 1500, '#4fd1c5'),
  makeBand('peaking', 4000, '#4fc3f7'),
  makeBand('highshelf', 9000, '#9d8cff'),
  makeBand('lowpass', 18_000, '#e58cff'),
]

/** The same band as another type, with what that type has no use for reset. */
export function changeType(band: Band, type: BandType): Band {
  return {
    ...band,
    type,
    gain: TYPES[type].gain ? band.gain : 0,
    q: DEFAULT_Q[type],
  }
}

/**
 * Where a band sits in the editor: frequency across, gain up. A type without
 * a gain stays on the 0 dB line.
 */
export function bandToPoint({ frequency, gain }: Band) {
  return {
    x: freqScale.normalize(frequency, FREQ_MIN, FREQ_MAX),
    y: 1 - gainScale.normalize(gain, GAIN_MIN, GAIN_MAX),
  }
}

export function pointToBand({ x, y }: { x: number; y: number }) {
  return {
    frequency: Math.round(freqScale.denormalize(x, FREQ_MIN, FREQ_MAX)),
    gain:
      Math.round(gainScale.denormalize(1 - y, GAIN_MIN, GAIN_MAX) * 10) / 10,
  }
}

export function formatFrequency(hz: number) {
  return hz < 1000
    ? `${Math.round(hz)} Hz`
    : `${(hz / 1000).toFixed(hz < 10_000 ? 2 : 1)} kHz`
}

export function formatGain(db: number) {
  return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`
}

/** The frequencies the curves are drawn at, spaced evenly in octaves. */
export const FREQUENCIES = Float32Array.from({ length: 256 }, (_, i) =>
  freqScale.denormalize(i / 255, FREQ_MIN, FREQ_MAX),
)

let context: OfflineAudioContext | null = null

/**
 * The options of the `BiquadFilterNode` for a band. On a lowpass or highpass
 * its `Q` is the resonance in dB rather than the quality factor the knob
 * shows (0.71 is flat), so it is converted on the way in.
 */
export function filterOptions({ type, frequency, gain, q }: Band) {
  const pass = type === 'lowpass' || type === 'highpass'
  return { type, frequency, gain, Q: pass ? 20 * Math.log10(q) : q }
}

/**
 * The response of one band in dB at each of `FREQUENCIES`, asked of a real
 * `BiquadFilterNode` so the curve is exactly what is heard. An offline
 * context never plays, so it needs no user gesture.
 */
export function bandResponse(band: Band) {
  context ??= new OfflineAudioContext(1, 1, 48_000)
  const filter = new BiquadFilterNode(context, filterOptions(band))
  const magnitude = new Float32Array(FREQUENCIES.length)
  const phase = new Float32Array(FREQUENCIES.length)
  filter.getFrequencyResponse(FREQUENCIES, magnitude, phase)
  return magnitude.map((m) => 20 * Math.log10(m))
}
