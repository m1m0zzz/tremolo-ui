import { ChangeEvent, CSSProperties, useRef, useState } from 'react'

import {
  curveScale,
  curveWithCenterValue,
  integerPart,
  linearScale,
  type Scale,
  toFixed,
} from '@tremolo-ui/functions'

import { XYPad } from '../../src/components/XYPad'

import styles from '../styles/DJFilterPad.module.css'

export default {
  title: 'combined/DJFilterPad',
  tags: ['!autodocs'],
}

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
    return `${toFixed(freq / 1000, 3 - (integerPart(freq / 1000)?.length ?? 0))}kHz`
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

type Branch = { node: BiquadFilterNode; wet: GainNode }

export const DJFilterPad = () => {
  const [sweep, setSweep] = useState(0)
  const [q, setQ] = useState(Q_CENTER)
  const [pressed, setPressed] = useState(false)
  // Read by the audio updates, which can run in the same event as the press
  // and would see the state from before it.
  const pressedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const graphRef = useRef<{
    context: AudioContext
    dry: GainNode
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
    const time = graph.context.currentTime
    const glide = (param: AudioParam, value: number) =>
      param.setTargetAtTime(value, time, 0.01)

    glide(graph.dry.gain, active ? 0 : 1)
    for (const type of ['lowpass', 'highpass'] as const) {
      const { node, wet } = graph[type]
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

  const handleAudio = (event: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    const file = event.target.files?.[0]
    if (!audio || !file) return

    // Built on the first file rather than on mount: a context has to be
    // started by a user gesture, and an element can feed only one source node.
    if (!graphRef.current) {
      const context = new AudioContext()
      const source = new MediaElementAudioSourceNode(context, {
        mediaElement: audio,
      })
      const dry = new GainNode(context, { gain: 1 })
      source.connect(dry).connect(context.destination)
      const branch = (type: BiquadFilterType): Branch => {
        const node = new BiquadFilterNode(context, { type })
        const wet = new GainNode(context, { gain: 0 })
        source.connect(node).connect(wet).connect(context.destination)
        return { node, wet }
      }
      graphRef.current = {
        context,
        dry,
        lowpass: branch('lowpass'),
        highpass: branch('highpass'),
      }
      updateAudio(sweep, q)
    }

    if (audio.src) URL.revokeObjectURL(audio.src)
    audio.src = URL.createObjectURL(file)
  }

  const filter = toFilter(sweep)

  // Where the thumb sits across the area, 0–1 on each axis, for the circles
  // and the border to follow.
  const position = [sweep, q].map((value, i) => {
    const normalized = scale[i].normalize(value, min[i], max[i])
    return reverse[i] ? 1 - normalized : normalized
  })

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="file"
          accept="audio/*"
          style={{ display: 'block', marginBottom: '0.5rem' }}
          onChange={handleAudio}
        />
        {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
        <audio
          ref={audioRef}
          controls={true}
          controlsList="nodownload"
          onPlay={() => graphRef.current?.context.resume()}
        />
      </div>
      <div
        style={{
          width: 'fit-content',
          color: '#222',
        }}
      >
        <div
          className={styles.pad}
          data-pressed={pressed || undefined}
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
                // press itself arrives through `onDragStart`.
                if (!pressedRef.current) return
                setSweep(x)
                setQ(y)
                updateAudio(x, y)
              }}
              onDragStart={(value) => press(true, value)}
              onDragEnd={(value) => press(false, value)}
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            marginTop: 6,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
          >
            <div>
              {filter ? (filter.type === 'lowpass' ? 'LPF' : 'HPF') : 'FILTER'}
            </div>
            <div>{filter ? fmt(filter.frequency) : 'OFF'}</div>
          </div>
          <div
            style={{
              width: 1,
              height: '80%',
              background: '#666',
            }}
          ></div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
          >
            <div>Q</div>
            <div>{q}</div>
          </div>
        </div>
      </div>
    </>
  )
}
