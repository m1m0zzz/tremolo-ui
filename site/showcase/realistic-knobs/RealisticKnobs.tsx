import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as Tone from 'tone'

import { exponentialScale } from '@tremolo-ui/functions'
import { Knob, useKnobContext } from '@tremolo-ui/react'

import { AudioSource } from '../shared/AudioSource'
import { Segments } from '../shared/Segments'

import styles from './RealisticKnobs.module.css'

type Param = 'drive' | 'tone' | 'level'

const LABELS: Record<Param, string> = {
  drive: 'Drive',
  tone: 'Tone',
  level: 'Level',
}
const INITIAL: Record<Param, number> = { drive: 4, tone: 6, level: 7 }

/** The numbers printed around a knob, 0 to 10. */
const NUMBERS = Array.from({ length: 11 }, (_, i) => i)
const LEDS = 15

/** Where the knob points, in degrees clockwise from the top. */
function useAngle() {
  return useKnobContext(({ p, r1, angleRange }) => r1 + p * angleRange)
}

export function RealisticKnobs() {
  const [values, setValues] = useState(INITIAL)
  const [touched, setTouched] = useState<Param>('drive')
  const graphRef = useRef<{
    distortion: Tone.Distortion
    filter: Tone.Filter
    volume: Tone.Volume
  }>(null)

  // A little drive pedal: distortion, a tone control, and the output level.
  const applyToAudio = ({ drive, tone, level }: Record<Param, number>) => {
    const graph = graphRef.current
    if (!graph) return
    graph.distortion.distortion = (drive / 10) * 0.9
    graph.distortion.wet.value = drive > 0 ? 1 : 0
    graph.filter.frequency.rampTo(
      exponentialScale.denormalize(tone / 10, 600, 18_000),
      0.05,
    )
    graph.volume.volume.rampTo(-36 + level * 4, 0.05)
    graph.volume.mute = level === 0
  }

  useEffect(() => applyToAudio(values), [values])

  const connect = () => {
    const distortion = new Tone.Distortion({ oversample: '4x' })
    const filter = new Tone.Filter({ type: 'lowpass', rolloff: -24 })
    const volume = new Tone.Volume()
    distortion.chain(filter, volume, Tone.getDestination())
    graphRef.current = { distortion, filter, volume }
    applyToAudio(values)
    return distortion
  }

  const knobProps = (param: Param) => ({
    value: values[param],
    min: 0,
    max: 10,
    step: 0.1,
    resetValue: INITIAL[param],
    'aria-label': LABELS[param],
    onChange: (value: number) => {
      setValues((prev) => ({ ...prev, [param]: value }))
      setTouched(param)
    },
  })

  return (
    <div className={styles.unit}>
      {['tl', 'tr', 'bl', 'br'].map((corner) => (
        <span key={corner} className={styles.screw} data-corner={corner} />
      ))}

      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.logo}>tremolo</span>
          <span className={styles.model}>OVERDRIVE · T-1</span>
        </div>
        <output className={styles.lcd}>
          {/* Fourteen segments spell the name; the number takes seven. */}
          <Segments
            segments={14}
            value={LABELS[touched].toUpperCase().padEnd(5)}
          />
          <Segments value={values[touched].toFixed(1).padStart(4)} />
        </output>
      </div>

      <div className={styles.controls}>
        <Control label="Drive">
          <div className={styles.dial}>
            <DialScale />
            <Knob.Root className={styles.aluminium} {...knobProps('drive')}>
              <AluminiumFace />
            </Knob.Root>
          </div>
        </Control>

        <Control label="Tone">
          <div className={styles.dial}>
            <DialScale />
            <Knob.Root className={styles.chickenHead} {...knobProps('tone')}>
              <ChickenHeadFace />
            </Knob.Root>
          </div>
        </Control>

        <Control label="Level">
          <Knob.Root className={styles.ledKnob} {...knobProps('level')}>
            <LedRingFace />
          </Knob.Root>
        </Control>
      </div>

      <AudioSource connect={connect} />
    </div>
  )
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.control}>
      {children}
      <span className={styles.label}>{label}</span>
    </div>
  )
}

/**
 * The scale printed on the panel around a knob. It stays put while the knob
 * turns, so it sits outside `Knob.Root` and knows nothing of the value.
 */
function DialScale() {
  const point = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180
    return { x: radius * Math.sin(rad), y: -radius * Math.cos(rad) }
  }

  return (
    <svg className={styles.scale} viewBox="-60 -60 120 120" aria-hidden>
      {Array.from({ length: 21 }, (_, i) => {
        const angle = -135 + i * 13.5
        const major = i % 2 === 0
        const from = point(angle, 41)
        const to = point(angle, major ? 46 : 44)
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            strokeWidth={major ? 1.2 : 0.7}
          />
        )
      })}
      {NUMBERS.map((n) => {
        const { x, y } = point(-135 + n * 27, 53)
        return (
          <text
            key={n}
            x={x}
            y={y}
            dominantBaseline="central"
            textAnchor="middle"
          >
            {n}
          </text>
        )
      })}
    </svg>
  )
}

/**
 * A machined aluminium cap in a knurled skirt. The reflection on the cap is
 * where the light is, so it holds still and only the knurling and the line
 * turn with the knob.
 */
function AluminiumFace() {
  const angle = useAngle()
  return (
    <>
      <div className={styles.knurl} style={{ rotate: `${angle}deg` }} />
      <div className={styles.cap} />
      <div className={styles.capLine} style={{ rotate: `${angle}deg` }} />
    </>
  )
}

/** A bakelite pointer knob, turned as one piece. */
function ChickenHeadFace() {
  const angle = useAngle()
  return (
    <svg
      className={styles.pointer}
      viewBox="0 0 100 100"
      style={{ rotate: `${angle}deg` }}
    >
      <defs>
        <radialGradient id="bakelite" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="55%" stopColor="#1b1b1b" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
      </defs>
      <path
        d="M50 2 C55 2 70 24 76 36 A29 29 0 1 1 24 36 C30 24 45 2 50 2 Z"
        fill="url(#bakelite)"
        stroke="#000"
        strokeWidth="1"
      />
      <circle
        cx="50"
        cy="50"
        r="17"
        fill="none"
        stroke="rgb(255 255 255 / 0.06)"
        strokeWidth="2"
      />
      <line
        x1="50"
        y1="8"
        x2="50"
        y2="34"
        stroke="#efe9da"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** A rubber knob in a ring of LEDs, lit up to the value. */
function LedRingFace() {
  const angle = useAngle()
  const { r1, angleRange } = useKnobContext()
  return (
    <>
      {Array.from({ length: LEDS }, (_, i) => {
        const ledAngle = r1 + (i / (LEDS - 1)) * angleRange
        return (
          <span
            key={i}
            className={styles.led}
            data-lit={ledAngle <= angle + 0.01 ? '' : undefined}
            style={{ rotate: `${ledAngle}deg` }}
          />
        )
      })}
      <div className={styles.rubber} style={{ rotate: `${angle}deg` }} />
    </>
  )
}
