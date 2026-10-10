import { clamp, exponentialScale } from '@tremolo-ui/functions'

export interface Envelope {
  /** ms */
  attack: number
  /** ms */
  decay: number
  /** 0–1 */
  sustain: number
  /** ms */
  release: number
}

export type Stage = 'attack' | 'decay' | 'release'

export const RANGES: Record<Stage, [number, number]> = {
  attack: [1, 2000],
  decay: [10, 2000],
  release: [10, 4000],
}

/**
 * How much of the width each stage may take. Sustain is a level rather than a
 * time, so it gets a fixed stretch of its own.
 */
const WIDTH = { attack: 0.28, decay: 0.28, sustain: 0.16, release: 0.28 }

/** Times are heard in proportion, so each stage is laid out logarithmically. */
const timeScale = exponentialScale

const stageWidth = (stage: Stage, ms: number) =>
  timeScale.normalize(ms, ...RANGES[stage]) * WIDTH[stage]

const stageTime = (stage: Stage, width: number) =>
  Math.round(
    timeScale.denormalize(clamp(width / WIDTH[stage], 0, 1), ...RANGES[stage]),
  )

/** The corners of the envelope, from 0 to 1 across and from the top down. */
export function corners({ attack, decay, sustain, release }: Envelope) {
  const peak = stageWidth('attack', attack)
  const decayEnd = peak + stageWidth('decay', decay)
  const sustainEnd = decayEnd + WIDTH.sustain
  return {
    start: { x: 0, y: 1 },
    peak: { x: peak, y: 0 },
    decayEnd: { x: decayEnd, y: 1 - sustain },
    sustainEnd: { x: sustainEnd, y: 1 - sustain },
    end: { x: sustainEnd + stageWidth('release', release), y: 1 },
  }
}

/** The handles back to times: each one is measured from the corner before it. */
export const fromPeak = (x: number): Partial<Envelope> => ({
  attack: stageTime('attack', x),
})

export const fromDecayEnd = (
  { x, y }: { x: number; y: number },
  envelope: Envelope,
): Partial<Envelope> => ({
  decay: stageTime('decay', x - corners(envelope).peak.x),
  sustain: Math.round((1 - y) * 100) / 100,
})

export const fromEnd = (x: number, envelope: Envelope): Partial<Envelope> => ({
  release: stageTime('release', x - corners(envelope).sustainEnd.x),
})

/** The furthest each handle can go, so it cannot pass the one before it. */
export function limits(envelope: Envelope) {
  const c = corners(envelope)
  return {
    peak: { min: 0, max: WIDTH.attack },
    decayEnd: { min: c.peak.x, max: c.peak.x + WIDTH.decay },
    end: { min: c.sustainEnd.x, max: c.sustainEnd.x + WIDTH.release },
  }
}

/**
 * Where a note is on the envelope, `held` ms after it started — or, once let
 * go, `released` ms after that. `level` is from 0 to 1.
 */
export function playhead(
  envelope: Envelope,
  held: number,
  released: number | null,
) {
  const { attack, decay, sustain, release } = envelope
  const c = corners(envelope)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1)

  const levelAt = (t: number) =>
    t < attack
      ? t / attack
      : t < attack + decay
        ? lerp(1, sustain, (t - attack) / decay)
        : sustain

  if (released === null) {
    if (held < attack)
      return { x: lerp(0, c.peak.x, held / attack), level: levelAt(held) }
    if (held < attack + decay) {
      return {
        x: lerp(c.peak.x, c.decayEnd.x, (held - attack) / decay),
        level: levelAt(held),
      }
    }
    // Sustain has no length: the dot walks across its stretch, once a second.
    const t = ((held - attack - decay) % 1000) / 1000
    return { x: lerp(c.decayEnd.x, c.sustainEnd.x, t), level: sustain }
  }

  // Released from whatever level the note had reached.
  const from = levelAt(held)
  return {
    x: lerp(c.sustainEnd.x, c.end.x, released / release),
    level: lerp(from, 0, released / release),
    done: released >= release,
  }
}

export function formatTime(ms: number) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`
}
