import {
  type ComponentProps,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Tone from 'tone'

import { exponentialScale } from '@tremolo-ui/functions'
import { AnimationCanvas, Knob, PointsEditor } from '@tremolo-ui/react'

import { AudioSource } from '../shared/AudioSource'

import {
  type Band,
  bandResponse,
  bandToPoint,
  formatFrequency,
  formatGain,
  FREQ_MAX,
  FREQ_MIN,
  FREQUENCIES,
  freqScale,
  GAIN_MAX,
  GAIN_MIN,
  gainScale,
  INITIAL_BANDS,
  pointToBand,
  Q_MAX,
  Q_MIN,
} from './bands'

import styles from './ParametricEQ.module.css'

const GRID_FREQUENCIES = [50, 100, 200, 500, 1000, 2000, 5000, 10_000]
const GRID_GAINS = [12, 6, 0, -6, -12]
/** The range of the analyser drawn behind the curves, in dBFS. */
const SPECTRUM_MIN = -110
const SPECTRUM_MAX = -10

const TYPE_LABELS = {
  lowshelf: 'Low shelf',
  peaking: 'Bell',
  highshelf: 'High shelf',
}

export function ParametricEQ() {
  const [bands, setBands] = useState(INITIAL_BANDS)
  const [selected, setSelected] = useState(2)
  const graphRef = useRef<{
    filters: Tone.BiquadFilter[]
    analyser: Tone.Analyser
  }>(null)

  const updateBand = (index: number, change: Partial<Band>) =>
    setBands((prev) =>
      prev.map((band, i) => (i === index ? { ...band, ...change } : band)),
    )

  // The audio follows the bands; the curves below are worked out from them.
  useEffect(() => {
    graphRef.current?.filters.forEach((filter, i) => {
      filter.frequency.rampTo(bands[i].frequency, 0.02)
      // Linear, not `rampTo`: the gain is in dB and is not converted, so
      // `rampTo` picks an exponential ramp, which cannot cross 0 and turns
      // into NaN between a cut and a boost.
      filter.gain.linearRampTo(bands[i].gain, 0.02)
      filter.Q.rampTo(bands[i].q, 0.02)
    })
  }, [bands])

  const connect = () => {
    const filters = bands.map(
      ({ type, frequency, gain, q }) =>
        new Tone.BiquadFilter({ type, frequency, gain, Q: q }),
    )
    const analyser = new Tone.Analyser({
      type: 'fft',
      size: 4096,
      smoothing: 0.85,
    })
    const input = new Tone.Gain()
    input.chain(...filters, analyser, Tone.getDestination())
    graphRef.current = { filters, analyser }
    return input
  }

  const responses = useMemo(() => bands.map(bandResponse), [bands])
  const total = useMemo(
    () =>
      FREQUENCIES.map((_, i) =>
        responses.reduce((sum, response) => sum + response[i], 0),
      ),
    [responses],
  )

  const draw = (
    ctx: CanvasRenderingContext2D,
    { width, height }: { width: number; height: number },
  ) => {
    const xOf = (hz: number) =>
      freqScale.normalize(hz, FREQ_MIN, FREQ_MAX) * width
    const yOf = (db: number) =>
      (1 -
        gainScale.normalize(
          Math.min(Math.max(db, GAIN_MIN), GAIN_MAX),
          GAIN_MIN,
          GAIN_MAX,
        )) *
      height

    ctx.clearRect(0, 0, width, height)

    // The grid, and what it measures.
    ctx.font = '10px system-ui, sans-serif'
    ctx.lineWidth = 1
    for (const hz of GRID_FREQUENCIES) {
      const x = Math.round(xOf(hz)) + 0.5
      ctx.strokeStyle = 'rgb(255 255 255 / 0.07)'
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
      ctx.fillStyle = 'rgb(255 255 255 / 0.35)'
      ctx.fillText(hz < 1000 ? `${hz}` : `${hz / 1000}k`, x + 3, height - 5)
    }
    for (const db of GRID_GAINS) {
      const y = Math.round(yOf(db)) + 0.5
      ctx.strokeStyle =
        db === 0 ? 'rgb(255 255 255 / 0.2)' : 'rgb(255 255 255 / 0.07)'
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
      ctx.fillStyle = 'rgb(255 255 255 / 0.35)'
      ctx.fillText(`${db > 0 ? '+' : ''}${db}`, 4, y - 3)
    }

    // What is playing, after the EQ.
    const analyser = graphRef.current?.analyser
    if (analyser) {
      const spectrum = analyser.getValue() as Float32Array
      const binWidth = Tone.getContext().sampleRate / 2 / spectrum.length
      ctx.beginPath()
      ctx.moveTo(0, height)
      for (let i = 1; i < spectrum.length; i++) {
        const hz = i * binWidth
        if (hz < FREQ_MIN) continue
        const level =
          (spectrum[i] - SPECTRUM_MIN) / (SPECTRUM_MAX - SPECTRUM_MIN)
        ctx.lineTo(xOf(hz), height * (1 - Math.min(Math.max(level, 0), 1)))
      }
      ctx.lineTo(width, height)
      ctx.fillStyle = 'rgb(255 255 255 / 0.08)'
      ctx.fill()
    }

    const curve = (response: Float32Array) => {
      ctx.beginPath()
      response.forEach((db, i) => ctx.lineTo(xOf(FREQUENCIES[i]), yOf(db)))
    }

    // The selected band on its own, filled down to 0 dB.
    const band = bands[selected]
    curve(responses[selected])
    ctx.lineTo(width, yOf(0))
    ctx.lineTo(0, yOf(0))
    ctx.fillStyle = `${band.color}33`
    ctx.fill()

    // Every band, and what they add up to.
    ctx.lineWidth = 1
    responses.forEach((response, i) => {
      curve(response)
      ctx.strokeStyle = `${bands[i].color}88`
      ctx.stroke()
    })
    curve(total)
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#f5f7fa'
    ctx.stroke()
  }

  const band = bands[selected]

  return (
    <div className={styles.eq}>
      <div className={styles.header}>
        <span className={styles.brand}>PARAMETRIC EQ</span>
        <AudioSource connect={connect} />
      </div>

      <PointsEditor.Root className={styles.editor}>
        <PointsEditor.Background>
          {/* Redrawn every frame while audio plays, for the analyser. */}
          <AnimationCanvas resizable draw={draw} />
        </PointsEditor.Background>
        <PointsEditor.Container>
          {bands.map((band, i) => (
            <PointsEditor.Point
              key={i}
              className={styles.point}
              value={bandToPoint(band)}
              color={band.color}
              data-active={i === selected ? '' : undefined}
              aria-label={{
                x: `Band ${i + 1} frequency`,
                y: `Band ${i + 1} gain`,
              }}
              aria-valuetext={{
                x: formatFrequency(band.frequency),
                y: formatGain(band.gain),
              }}
              onFocus={() => setSelected(i)}
              onChange={(point) => updateBand(i, pointToBand(point))}
              // A double click flattens the band.
              onDoubleClick={() => updateBand(i, { gain: 0 })}
            >
              {i + 1}
            </PointsEditor.Point>
          ))}
        </PointsEditor.Container>
      </PointsEditor.Root>

      <div className={styles.controls}>
        <div className={styles.bands} role="group" aria-label="Bands">
          {bands.map((band, i) => (
            <button
              key={i}
              type="button"
              className={styles.bandButton}
              style={{ '--band-color': band.color } as CSSProperties}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              <span className={styles.bandNumber}>{i + 1}</span>
              {TYPE_LABELS[band.type]}
            </button>
          ))}
        </div>

        <div
          className={styles.knobs}
          style={{ '--band-color': band.color } as CSSProperties}
        >
          <EQKnob
            label="Freq"
            display={formatFrequency(band.frequency)}
            value={band.frequency}
            min={FREQ_MIN}
            max={FREQ_MAX}
            scale={exponentialScale}
            resetValue={INITIAL_BANDS[selected].frequency}
            onChange={(frequency) => updateBand(selected, { frequency })}
          />
          <EQKnob
            label="Gain"
            display={formatGain(band.gain)}
            value={band.gain}
            min={GAIN_MIN}
            max={GAIN_MAX}
            step={0.1}
            // The arc grows from the centre, either way.
            startValue={0}
            onChange={(gain) => updateBand(selected, { gain })}
          />
          <EQKnob
            label="Q"
            display={band.type === 'peaking' ? band.q.toFixed(2) : '—'}
            value={band.q}
            min={Q_MIN}
            max={Q_MAX}
            step={0.01}
            scale={exponentialScale}
            resetValue={INITIAL_BANDS[selected].q}
            disabled={band.type !== 'peaking'}
            onChange={(q) => updateBand(selected, { q })}
          />
        </div>
      </div>
    </div>
  )
}

function EQKnob({
  label,
  display,
  ...props
}: { label: string; display: string } & Omit<
  ComponentProps<typeof Knob.Root>,
  'children'
>) {
  return (
    <div className={styles.knob}>
      <span className={styles.knobLabel}>{label}</span>
      <Knob.Root
        className={styles.knobRoot}
        aria-label={label}
        aria-valuetext={display}
        {...props}
      >
        <Knob.SVGRoot>
          <Knob.InactiveLine className={styles.knobInactive} strokeWidth={8} />
          <Knob.ActiveLine className={styles.knobActive} strokeWidth={8} />
          <Knob.Thumb
            className={styles.knobThumb}
            classes={{ line: styles.knobThumbLine }}
            size={68}
            lineWeight={8}
            lineLength={28}
          />
        </Knob.SVGRoot>
      </Knob.Root>
      <output className={styles.knobValue}>{display}</output>
    </div>
  )
}
