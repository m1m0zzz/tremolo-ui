import { exponentialScale, linearScale } from '@tremolo-ui/functions'

export type BandType = 'lowshelf' | 'peaking' | 'highshelf'

export interface Band {
  type: BandType
  /** Hz */
  frequency: number
  /** dB */
  gain: number
  /** Ignored by the shelves: a `BiquadFilterNode` shelf has no Q. */
  q: number
  color: string
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

export const INITIAL_BANDS: Band[] = [
  { type: 'lowshelf', frequency: 80, gain: 3, q: 0.71, color: '#ff6b6b' },
  { type: 'peaking', frequency: 300, gain: -4, q: 1.4, color: '#ffb347' },
  { type: 'peaking', frequency: 1200, gain: 2.5, q: 1, color: '#7bd88f' },
  { type: 'peaking', frequency: 4500, gain: -3, q: 2.5, color: '#4fc3f7' },
  { type: 'highshelf', frequency: 10_000, gain: 4, q: 0.71, color: '#c792ea' },
]

/** Where a band sits in the editor: frequency across, gain up. */
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
 * The response of one band in dB at each of `FREQUENCIES`, asked of a real
 * `BiquadFilterNode` so the curve is exactly what is heard. An offline
 * context never plays, so it needs no user gesture.
 */
export function bandResponse({ type, frequency, gain, q }: Band) {
  context ??= new OfflineAudioContext(1, 1, 48_000)
  const filter = new BiquadFilterNode(context, { type, frequency, gain, Q: q })
  const magnitude = new Float32Array(FREQUENCIES.length)
  const phase = new Float32Array(FREQUENCIES.length)
  filter.getFrequencyResponse(FREQUENCIES, magnitude, phase)
  return magnitude.map((m) => 20 * Math.log10(m))
}
