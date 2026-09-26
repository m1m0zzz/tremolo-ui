import { radian, type Scale } from '@tremolo-ui/functions'

/**
 * Width and height of the viewBox a knob is drawn in. The arcs and the thumb
 * are laid out in these units, and the SVG scales them to the knob's size.
 */
export const KNOB_VIEWBOX_SIZE = 100

const center = KNOB_VIEWBOX_SIZE / 2

export interface KnobAngleOptions {
  value: number
  min: number
  max: number
  scale: Scale
  /** Where the active arc starts from, so that it can grow from the middle. */
  startValue: number
  /** How far the knob turns from `min` to `max`, in degrees. */
  angleRange: number
}

/**
 * The angles a knob is drawn with, in degrees clockwise from the top.
 *
 * The travel is centred on the top, so `angleRange` of 270 runs from -135 to
 * 135. Derived from the value alone, so a wrapper can call it while rendering.
 */
export interface KnobAngles {
  /** The value, normalized to 0..1 along the scale. */
  p: number
  /** Where the travel starts. */
  r1: number
  /** Where the active arc starts: the lower of the value and `startValue`. */
  r2: number
  /** Where the active arc ends: the higher of the value and `startValue`. */
  r3: number
  /** Where the travel ends. */
  r4: number
}

export function knobAngles({
  value,
  min,
  max,
  scale,
  startValue,
  angleRange,
}: KnobAngleOptions): KnobAngles {
  const p = scale.normalize(value, min, max)
  const s = scale.normalize(startValue, min, max)
  const r1 = -angleRange / 2
  const r2 = r1 + Math.min(p, s) * angleRange
  const r3 = r1 + Math.max(p, s) * angleRange
  const r4 = angleRange / 2
  return { p, r1, r2, r3, r4 }
}

/**
 * The point at `angle` on a circle of `radius` around the centre of the
 * viewBox.
 *
 * The radius depends on the stroke of the line being drawn, which each arc
 * has its own of, so the point is found per arc rather than once for the knob.
 */
export function knobArcPoint(angle: number, radius: number) {
  return {
    x: center + radius * Math.cos(radian(angle - 90)),
    y: center + radius * Math.sin(radian(angle - 90)),
  }
}

/**
 * The radius that keeps a stroke of `strokeWidth` inside the viewBox: half of
 * the stroke falls outside the path it is drawn along.
 */
export function knobArcRadius(strokeWidth: number | string | undefined) {
  const width =
    typeof strokeWidth === 'number'
      ? strokeWidth
      : Number.parseFloat(String(strokeWidth))
  return Number.isFinite(width) ? center - width / 2 : center
}

/** Build an SVG path for an arc, splitting full turns into drawable segments. */
export function knobArcPath(
  startAngle: number,
  endAngle: number,
  radius: number,
) {
  const start = knobArcPoint(startAngle, radius)
  const sweep = endAngle - startAngle
  const segmentCount = Math.max(1, Math.ceil(Math.abs(sweep) / 180))
  const segmentSweep = sweep / segmentCount
  let path = `M ${start.x} ${start.y}`
  for (let i = 1; i <= segmentCount; i += 1) {
    const end = knobArcPoint(startAngle + segmentSweep * i, radius)
    path += ` A ${radius} ${radius} 0 0 ${segmentSweep >= 0 ? 1 : 0} ${end.x} ${end.y}`
  }
  return path
}
