import { useRef, useState, type CSSProperties } from 'react'
import * as Tone from 'tone'

import {
  curveScale,
  curveWithCenterValue,
  linearScale,
  type Scale,
  toFixed,
} from '@tremolo-ui/functions'
import { XYPad } from '@tremolo-ui/react'

import { AudioSource } from '../shared/AudioSource'

import styles from './DJFilterPad.module.css'

/** x is the sweep, -1 (left) to 1 (right); y is Q. */
const min: [number, number] = [-1, 0.3]
const max: [number, number] = [1, 5]
/** The Q at which the filter is flat, put at the vertical centre of the pad. */
const Q_CENTER = 0.707
const scale: [Scale, Scale] = [
  linearScale,
  curveScale(curveWithCenterValue(Q_CENTER, min[1], max[1])),
]
const reverse: [boolean, boolean] = [false, true]

const CUTOFF_MIN = 60
const CUTOFF_MAX = 20_000
/** How far either side of the centre still counts as the centre. */
const DEAD_ZONE = 0.05

type Filter = { type: 'lowpass' | 'highpass'; frequency: number }

/**
 * Left of the centre sweeps a lowpass down from 20 kHz to 60 Hz, right of it a
 * highpass up from 60 Hz to 20 kHz. Around the centre nothing is filtered.
 */
const toFilter = (sweep: number): Filter | null => {
  const amount = (Math.abs(sweep) - DEAD_ZONE) / (1 - DEAD_ZONE)
  if (amount <= 0) return null
  // Exponential, so that the same distance on the pad covers the same number
  // of octaves.
  const ratio = CUTOFF_MAX / CUTOFF_MIN
  return sweep < 0
    ? { type: 'lowpass', frequency: CUTOFF_MAX / ratio ** amount }
    : { type: 'highpass', frequency: CUTOFF_MIN * ratio ** amount }
}

const fmt = (freq: number) => {
  if (freq < 1000) {
    return `${toFixed(freq)}Hz`
  } else {
    // Three significant digits: 1.23kHz, 12.3kHz, 123kHz.
    const kHz = freq / 1000
    return `${toFixed(kHz, Math.max(0, 3 - String(Math.trunc(kHz)).length))}kHz`
  }
}

const describe = (filter: Filter | null) =>
  filter
    ? `${filter.type === 'lowpass' ? 'LPF' : 'HPF'} ${fmt(filter.frequency)}`
    : 'OFF'

/**
 * `Q` is in dB on a lowpass or highpass `BiquadFilterNode`, while the pad
 * shows the plain quality factor (0.707 is flat), so it is converted on the
 * way in.
 */
const qToDecibels = (q: number) => 20 * Math.log10(q)

type Branch = { filter: Tone.BiquadFilter; wet: Tone.Gain }

/** Any of the params below: a gain, a frequency and a Q. */
type GlideTarget = {
  setTargetAtTime(
    value: number,
    startTime: number,
    timeConstant: number,
  ): unknown
}

export function DJFilterPad() {
  const [sweep, setSweep] = useState(0)
  const [q, setQ] = useState(Q_CENTER)
  const [pressed, setPressed] = useState(false)
  // Read by the audio updates, which can run in the same event as the press
  // and would see the state from before it.
  const pressedRef = useRef(false)
  const graphRef = useRef<{
    input: Tone.Gain
    dry: Tone.Gain
    lowpass: Branch
    highpass: Branch
  }>(null)

  const updateAudio = (sweep: number, q: number) => {
    const graph = graphRef.current
    if (!graph) return
    const filter = toFilter(sweep)
    // The filter only acts while the pad is held down.
    const active = pressedRef.current ? filter?.type : undefined
    // Short glides instead of jumps, so that neither dragging nor switching
    // between the paths clicks.
    const time = Tone.now()
    const glide = (param: GlideTarget, value: number) =>
      param.setTargetAtTime(value, time, 0.01)

    glide(graph.dry.gain, active ? 0 : 1)
    for (const type of ['lowpass', 'highpass'] as const) {
      const { filter: node, wet } = graph[type]
      glide(wet.gain, active === type ? 1 : 0)
      glide(node.Q, qToDecibels(q))
      // An idle filter waits at the end it is entered from — the centre — so
      // it does not sweep in from wherever it was left.
      const idle = type === 'lowpass' ? CUTOFF_MAX : CUTOFF_MIN
      glide(node.frequency, filter?.type === type ? filter.frequency : idle)
    }
  }

  const press = (next: boolean, value: [number, number]) => {
    pressedRef.current = next
    setPressed(next)
    // Let go, the pad springs back to the centre: no filter and a flat Q.
    const [x, y] = next ? value : [0, Q_CENTER]
    setSweep(x)
    setQ(y)
    updateAudio(x, y)
  }

  // A dry path and a filtered one for each side, crossfaded by their gains.
  const connect = () => {
    const input = new Tone.Gain()
    const dry = new Tone.Gain(1).toDestination()
    const branch = (type: 'lowpass' | 'highpass'): Branch => {
      const filter = new Tone.BiquadFilter({ type })
      const wet = new Tone.Gain(0).toDestination()
      input.chain(filter, wet)
      return { filter, wet }
    }
    input.connect(dry)
    graphRef.current = {
      input,
      dry,
      lowpass: branch('lowpass'),
      highpass: branch('highpass'),
    }
    updateAudio(sweep, q)
    return input
  }

  const filter = toFilter(sweep)

  // Where the thumb sits across the area, 0–1 on each axis, for the circles
  // and the border to follow.
  const position = [sweep, q].map((value, i) => {
    const normalized = scale[i].normalize(value, min[i], max[i])
    return reverse[i] ? 1 - normalized : normalized
  })

  return (
    <div className={styles.demo}>
      <AudioSource connect={connect} />
      <div className={styles.unit}>
        <div
          className={styles.pad}
          data-pressed={pressed ? '' : undefined}
          style={{ '--x': position[0], '--y': position[1] } as CSSProperties}
        >
          <div className={styles.surface}>
            <div className={styles.dots} />
            <div className={styles.glow}>
              <div className={styles.circles} />
            </div>
            <XYPad.Root
              className={styles.root}
              value={[sweep, q]}
              min={min}
              max={max}
              // Fine enough on y for the centre, 0.707, to be reachable.
              step={[0.01, 0.001]}
              scale={scale}
              reverse={reverse}
              // Only a press moves the pad, which springs back when let go.
              wheel={null}
              keyboard={null}
              onChange={([x, y]) => {
                // `keyboard={null}` only stops the arrow keys: Home, End and
                // the page keys still reach the thumb's range inputs. Only a
                // press moves this pad, so anything else is dropped here. The
                // press itself arrives through `onChangeStart`.
                if (!pressedRef.current) return
                setSweep(x)
                setQ(y)
                updateAudio(x, y)
              }}
              // Held by the pointer only: the wheel and the keys move the
              // thumb, but nothing presses the pad down for them.
              onChangeStart={(value, source) => {
                if (source === 'pointer') press(true, value)
              }}
              onChangeEnd={(value, source) => {
                if (source === 'pointer') press(false, value)
              }}
            >
              <XYPad.Area className={styles.area}>
                <XYPad.Thumb
                  className={styles.thumb}
                  aria-label={['filter', 'Q']}
                  aria-valuetext={[describe(filter), undefined]}
                />
              </XYPad.Area>
            </XYPad.Root>
          </div>
        </div>
        <div className={styles.readout}>
          <div className={styles.value}>
            <span>
              {filter ? (filter.type === 'lowpass' ? 'LPF' : 'HPF') : 'FILTER'}
            </span>
            <span>{filter ? fmt(filter.frequency) : 'OFF'}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.value}>
            <span>Q</span>
            <span>{q}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
