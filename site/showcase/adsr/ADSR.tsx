import { useEffect, useRef, useState, type ComponentProps } from 'react'
import * as Tone from 'tone'

import { exponentialScale, gainToDb } from '@tremolo-ui/functions'
import { AnimationCanvas, Knob, Piano, PointsEditor } from '@tremolo-ui/react'

import {
  corners,
  type Envelope,
  formatTime,
  fromDecayEnd,
  fromEnd,
  fromPeak,
  limits,
  playhead,
  RANGES,
} from './envelope'

import styles from './ADSR.module.css'

const INITIAL: Envelope = { attack: 30, decay: 400, sustain: 0.5, release: 800 }

export function ADSR() {
  const [envelope, setEnvelope] = useState(INITIAL)
  const synthRef = useRef<Tone.PolySynth>(null)
  /** When the last note started and, once every key is up, when it ended. */
  const noteRef = useRef<{ on: number; off: number | null; held: Set<number> }>(
    {
      on: 0,
      off: null,
      held: new Set(),
    },
  )

  const update = (change: Partial<Envelope>) =>
    setEnvelope((prev) => ({ ...prev, ...change }))

  const toTone = ({ attack, decay, sustain, release }: Envelope) => ({
    attack: attack / 1000,
    decay: decay / 1000,
    sustain,
    release: release / 1000,
    // Straight lines, so that what is heard is what is drawn.
    attackCurve: 'linear' as const,
    decayCurve: 'linear' as const,
    releaseCurve: 'linear' as const,
  })

  useEffect(() => {
    synthRef.current?.set({ envelope: toTone(envelope) })
  }, [envelope])

  useEffect(() => () => void synthRef.current?.dispose(), [])

  const playNote = async (note: number, velocity = 0.8) => {
    await Tone.start()
    synthRef.current ??= new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 2, spread: 16 },
      envelope: toTone(envelope),
      volume: -14,
    }).connect(new Tone.Filter(2400, 'lowpass').toDestination())
    synthRef.current.triggerAttack(
      Tone.Frequency(note, 'midi').toFrequency(),
      undefined,
      velocity,
    )
    const state = noteRef.current
    if (state.held.size === 0) {
      state.on = performance.now()
      state.off = null
    }
    state.held.add(note)
  }

  const stopNote = (note: number) => {
    synthRef.current?.triggerRelease(Tone.Frequency(note, 'midi').toFrequency())
    const state = noteRef.current
    state.held.delete(note)
    if (state.held.size === 0) state.off = performance.now()
  }

  const c = corners(envelope)
  const range = limits(envelope)

  const draw = (
    ctx: CanvasRenderingContext2D,
    { width, height }: { width: number; height: number },
  ) => {
    const px = ({ x, y }: { x: number; y: number }) =>
      [x * width, y * height] as const
    ctx.clearRect(0, 0, width, height)

    // The colours come from the theme, through the stylesheet, so the graph
    // follows light and dark like everything around it.
    const css = getComputedStyle(ctx.canvas)
    const color = (name: string) => css.getPropertyValue(name).trim()
    const accent = color('--accent')

    // A grid in quarters of the level.
    ctx.strokeStyle = color('--graph-grid')
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const y = Math.round((height * i) / 4) + 0.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const path = () => {
      ctx.beginPath()
      for (const corner of [c.start, c.peak, c.decayEnd, c.sustainEnd, c.end])
        ctx.lineTo(...px(corner))
    }

    // The area under the envelope, then the line over it.
    path()
    ctx.closePath()
    const fill = ctx.createLinearGradient(0, 0, 0, height)
    fill.addColorStop(0, `${accent}40`)
    fill.addColorStop(1, `${accent}00`)
    ctx.fillStyle = fill
    ctx.fill()

    // The sustain stretch is a level held for as long as the key is.
    ctx.setLineDash([3, 4])
    ctx.strokeStyle = `${accent}66`
    ctx.beginPath()
    ctx.moveTo(...px(c.sustainEnd))
    ctx.lineTo(c.sustainEnd.x * width, height)
    ctx.stroke()
    ctx.setLineDash([])

    path()
    ctx.strokeStyle = accent
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Where the note being played has got to.
    const { on, off, held } = noteRef.current
    if (held.size > 0 || off !== null) {
      const now = performance.now()
      const head = playhead(
        envelope,
        (off ?? now) - on,
        off === null ? null : now - off,
      )
      if (!head.done) {
        const [x, y] = px({ x: head.x, y: 1 - head.level })
        ctx.fillStyle = `${accent}22`
        ctx.fillRect(x - 0.5, 0, 1, height)
        ctx.shadowColor = accent
        ctx.shadowBlur = 16
        ctx.fillStyle = color('--graph-playhead')
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }
  }

  return (
    <div className={styles.adsr}>
      <div className={styles.header}>
        <span className={styles.title}>ENVELOPE</span>
        <span className={styles.hint}>drag the handles · play the keys</span>
      </div>

      <div className={styles.graph}>
        <PointsEditor.Root className={styles.editor}>
          <PointsEditor.Background>
            <AnimationCanvas resizable draw={draw} />
          </PointsEditor.Background>
          <PointsEditor.Container>
            <PointsEditor.Point
              className={styles.handle}
              value={c.peak}
              min={{ x: range.peak.min, y: 0 }}
              max={{ x: range.peak.max, y: 0 }}
              aria-label={{ x: 'Attack', y: 'Peak' }}
              aria-valuetext={{ x: formatTime(envelope.attack) }}
              onChange={({ x }) => update(fromPeak(x))}
            >
              A
            </PointsEditor.Point>
            <PointsEditor.Point
              className={styles.handle}
              value={c.decayEnd}
              min={{ x: range.decayEnd.min, y: 0 }}
              max={{ x: range.decayEnd.max, y: 1 }}
              aria-label={{ x: 'Decay', y: 'Sustain' }}
              aria-valuetext={{
                x: formatTime(envelope.decay),
                y: `${Math.round(envelope.sustain * 100)}%`,
              }}
              onChange={(point) => update(fromDecayEnd(point, envelope))}
            >
              D
            </PointsEditor.Point>
            <PointsEditor.Point
              className={styles.handle}
              value={c.end}
              min={{ x: range.end.min, y: 1 }}
              max={{ x: range.end.max, y: 1 }}
              aria-label={{ x: 'Release', y: 'End' }}
              aria-valuetext={{ x: formatTime(envelope.release) }}
              onChange={({ x }) => update(fromEnd(x, envelope))}
            >
              R
            </PointsEditor.Point>
          </PointsEditor.Container>
        </PointsEditor.Root>
      </div>

      <div className={styles.knobs}>
        <EnvelopeKnob
          label="Attack"
          display={formatTime(envelope.attack)}
          value={envelope.attack}
          min={RANGES.attack[0]}
          max={RANGES.attack[1]}
          scale={exponentialScale}
          resetValue={INITIAL.attack}
          onChange={(attack) => update({ attack })}
        />
        <EnvelopeKnob
          label="Decay"
          display={formatTime(envelope.decay)}
          value={envelope.decay}
          min={RANGES.decay[0]}
          max={RANGES.decay[1]}
          scale={exponentialScale}
          resetValue={INITIAL.decay}
          onChange={(decay) => update({ decay })}
        />
        <EnvelopeKnob
          label="Sustain"
          display={
            envelope.sustain === 0
              ? '-∞ dB'
              : `${gainToDb(envelope.sustain).toFixed(1)} dB`
          }
          value={envelope.sustain}
          min={0}
          max={1}
          step={0.01}
          resetValue={INITIAL.sustain}
          onChange={(sustain) => update({ sustain })}
        />
        <EnvelopeKnob
          label="Release"
          display={formatTime(envelope.release)}
          value={envelope.release}
          min={RANGES.release[0]}
          max={RANGES.release[1]}
          scale={exponentialScale}
          resetValue={INITIAL.release}
          onChange={(release) => update({ release })}
        />
      </div>

      <Piano.Root
        className={styles.piano}
        noteRange={{ first: 60, last: 76 }}
        whiteKeyWidth={34}
        keyProps={(_note, { keyType }) => ({
          className: keyType === 'white' ? styles.whiteKey : styles.blackKey,
        })}
        onPlayNote={(note, velocity) => void playNote(note, velocity)}
        onStopNote={stopNote}
      />
    </div>
  )
}

function EnvelopeKnob({
  label,
  display,
  ...props
}: { label: string; display: string } & Omit<
  ComponentProps<typeof Knob.Root>,
  'children'
>) {
  return (
    <div className={styles.knob}>
      <Knob.Root
        className={styles.knobRoot}
        aria-label={label}
        aria-valuetext={display}
        {...props}
      >
        <Knob.SVGRoot>
          <Knob.InactiveLine className={styles.knobTrack} strokeWidth={5} />
          <Knob.ActiveLine className={styles.knobValue} strokeWidth={5} />
          <Knob.Thumb
            className={styles.knobThumb}
            classes={{ line: styles.knobThumbLine }}
            size={66}
            lineWeight={7}
            lineLength={26}
          />
        </Knob.SVGRoot>
      </Knob.Root>
      <span className={styles.knobLabel}>{label}</span>
      <output className={styles.knobDisplay}>{display}</output>
    </div>
  )
}
