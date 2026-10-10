import {
  type ComponentProps,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Tone from 'tone'

import { clamp, exponentialScale } from '@tremolo-ui/functions'
import {
  AnimationCanvas,
  Knob,
  PointsEditor,
  useEventListener,
} from '@tremolo-ui/react'

import { AudioSource } from '../shared/AudioSource'

import {
  type Band,
  bandResponse,
  bandToPoint,
  type BandType,
  changeType,
  DEFAULT_Q,
  filterOptions,
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
  TYPES,
} from './bands'

import styles from './ParametricEQ.module.css'

const GRID_FREQUENCIES = [50, 100, 200, 500, 1000, 2000, 5000, 10_000]
const GRID_GAINS = [12, 6, 0, -6, -12]
/** The range of the analyser drawn behind the curves, in dBFS. */
const SPECTRUM_MIN = -110
const SPECTRUM_MAX = -10

/** How far an Alt + drag goes to take Q across its whole range, in pixels. */
const Q_DRAG_RANGE = 200

export function ParametricEQ() {
  const [bands, setBands] = useState(INITIAL_BANDS)
  /** The band the knobs edit: the one last focused, dragged or picked. */
  const [selected, setSelected] = useState(3)
  const graphRef = useRef<{
    input: Tone.Gain
    filters: Tone.BiquadFilter[]
    analyser: Tone.Analyser
  }>(null)

  /** Chain the bands that are on, in order, and leave the rest out. */
  const wire = (bands: Band[]) => {
    const graph = graphRef.current
    if (!graph) return
    graph.input.disconnect()
    for (const filter of graph.filters) filter.disconnect()
    const on = graph.filters.filter((_, i) => bands[i].enabled)
    graph.input.chain(...on, graph.analyser)
  }

  const toggleBand = (index: number) => {
    const next = bands.map((band, i) =>
      i === index ? { ...band, enabled: !band.enabled } : band,
    )
    setBands(next)
    wire(next)
  }

  const updateBand = (index: number, change: Partial<Band>) =>
    setBands((prev) =>
      prev.map((band, i) => (i === index ? { ...band, ...change } : band)),
    )

  // Held Alt changes what a drag on a bell does, so the cursor says so.
  const [alt, setAlt] = useState(false)
  useEventListener(window, 'keydown', (e) => setAlt(e.altKey))
  useEventListener(window, 'keyup', (e) => setAlt(e.altKey))
  useEventListener(window, 'blur', () => setAlt(false))

  /**
   * Alt + drag on a band with a Q turns it instead of moving the band: up
   * narrows it, down widens it. This runs in the capture phase, so the press is stopped
   * on its way down, before the point's own drag ever sees it.
   */
  const startQDrag = (event: ReactPointerEvent) => {
    if (!event.altKey || event.button !== 0) return
    const point = (event.target as Element).closest<HTMLElement>('[data-band]')
    if (!point) return
    const index = Number(point.dataset.band)
    if (!TYPES[bands[index].type].q) return
    event.stopPropagation()
    event.preventDefault()
    // Selected, as a drag on it would.
    point.focus()

    const startY = event.clientY
    const start = exponentialScale.normalize(bands[index].q, Q_MIN, Q_MAX)
    const move = (e: PointerEvent) => {
      const position = clamp(start + (startY - e.clientY) / Q_DRAG_RANGE, 0, 1)
      const q = exponentialScale.denormalize(position, Q_MIN, Q_MAX)
      updateBand(index, { q: Math.round(q * 100) / 100 })
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      document.body.style.removeProperty('cursor')
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    document.body.style.cursor = 'ns-resize'
  }

  // The audio follows the bands; the curves below are worked out from them.
  useEffect(() => {
    graphRef.current?.filters.forEach((filter, i) => {
      const { type, frequency, gain, Q } = filterOptions(bands[i])
      filter.type = type
      filter.frequency.rampTo(frequency, 0.02)
      // Linear, not `rampTo`: the gain is in dB and is not converted, so
      // `rampTo` picks an exponential ramp, which cannot cross 0 and turns
      // into NaN between a cut and a boost.
      filter.gain.linearRampTo(gain, 0.02)
      filter.Q.rampTo(Q, 0.02)
    })
  }, [bands])

  const connect = () => {
    const filters = bands.map(
      (band) => new Tone.BiquadFilter(filterOptions(band)),
    )
    const analyser = new Tone.Analyser({
      type: 'fft',
      size: 4096,
      smoothing: 0.85,
    })
    const input = new Tone.Gain()
    analyser.toDestination()
    graphRef.current = { input, filters, analyser }
    wire(bands)
    return input
  }

  const responses = useMemo(() => bands.map(bandResponse), [bands])
  // Only the bands that are on add to what is heard.
  const total = useMemo(
    () =>
      FREQUENCIES.map((_, i) =>
        responses.reduce(
          (sum, response, band) =>
            bands[band].enabled ? sum + response[i] : sum,
          0,
        ),
      ),
    [responses, bands],
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

    // The colours come from the theme, through the stylesheet, so the graph
    // follows light and dark like everything around it.
    const css = getComputedStyle(ctx.canvas)
    const color = (name: string) => css.getPropertyValue(name).trim()

    // The grid, and what it measures.
    ctx.font = '10px system-ui, sans-serif'
    ctx.lineWidth = 1
    for (const hz of GRID_FREQUENCIES) {
      const x = Math.round(xOf(hz)) + 0.5
      ctx.strokeStyle = color('--graph-grid')
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
      ctx.fillStyle = color('--graph-label')
      ctx.fillText(hz < 1000 ? `${hz}` : `${hz / 1000}k`, x + 3, height - 5)
    }
    for (const db of GRID_GAINS) {
      const y = Math.round(yOf(db)) + 0.5
      ctx.strokeStyle = color(db === 0 ? '--graph-zero' : '--graph-grid')
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
      ctx.fillStyle = color('--graph-label')
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
      ctx.fillStyle = color('--graph-spectrum')
      ctx.fill()
    }

    const curve = (response: Float32Array) => {
      ctx.beginPath()
      response.forEach((db, i) => ctx.lineTo(xOf(FREQUENCIES[i]), yOf(db)))
    }

    // The selected band on its own, filled down to 0 dB, while it is on.
    const band = bands[selected]
    if (band.enabled) {
      curve(responses[selected])
      ctx.lineTo(width, yOf(0))
      ctx.lineTo(0, yOf(0))
      ctx.fillStyle = `${band.color}33`
      ctx.fill()
    }

    // Every band, and what they add up to. One that is off is dashed.
    ctx.lineWidth = 1
    responses.forEach((response, i) => {
      curve(response)
      ctx.setLineDash(bands[i].enabled ? [] : [3, 4])
      ctx.strokeStyle = `${bands[i].color}88`
      ctx.stroke()
    })
    ctx.setLineDash([])
    curve(total)
    ctx.lineWidth = 2.5
    ctx.strokeStyle = color('--graph-curve')
    ctx.stroke()
  }

  const band = bands[selected]

  return (
    <div className={styles.eq}>
      <div className={styles.header}>
        <span className={styles.brand}>PARAMETRIC EQ</span>
        <span className={styles.hint}>
          Drag on empty space: select · Alt + drag: Q
        </span>
        <AudioSource connect={connect} />
      </div>

      {/* Selectable: a drag across empty space selects several bands, and a
          drag on one of them moves them all. */}
      <PointsEditor.Root
        className={styles.editor}
        selectable
        data-alt={alt ? '' : undefined}
        onPointerDownCapture={startQDrag}
      >
        <PointsEditor.Background>
          {/* Redrawn every frame while audio plays, for the analyser. */}
          <AnimationCanvas resizable draw={draw} />
        </PointsEditor.Background>
        <PointsEditor.Container>
          {bands.map((band, i) => (
            <PointsEditor.Point
              key={i}
              id={`band-${i}`}
              className={styles.point}
              value={bandToPoint(band)}
              color={band.color}
              data-band={i}
              data-active={i === selected ? '' : undefined}
              data-off={band.enabled ? undefined : ''}
              data-q={TYPES[band.type].q ? '' : undefined}
              aria-label={{
                x: `Band ${i + 1} frequency`,
                // A type without a gain takes its Q up and down instead.
                y: `Band ${i + 1} ${TYPES[band.type].gain ? 'gain' : 'Q'}`,
              }}
              aria-valuetext={{
                x: formatFrequency(band.frequency),
                y: TYPES[band.type].gain
                  ? formatGain(band.gain)
                  : band.q.toFixed(2),
              }}
              onFocus={() => setSelected(i)}
              onChange={(point) => updateBand(i, pointToBand(point, band.type))}
            >
              {i + 1}
            </PointsEditor.Point>
          ))}
          <PointsEditor.SelectionBox className={styles.selectionBox} />
        </PointsEditor.Container>
      </PointsEditor.Root>

      <div className={styles.controls}>
        {/* A row per band: on or off, and its type. Focus anywhere in a row
            hands the band to the knobs. */}
        <div className={styles.bands}>
          {bands.map((band, i) => (
            <div
              key={i}
              className={styles.bandRow}
              style={{ '--band-color': band.color } as CSSProperties}
              data-active={i === selected ? '' : undefined}
              onFocus={() => setSelected(i)}
              onPointerDown={() => setSelected(i)}
            >
              <button
                type="button"
                role="switch"
                className={styles.bandSwitch}
                aria-checked={band.enabled}
                aria-label={`Band ${i + 1}`}
                onClick={() => toggleBand(i)}
              >
                {i + 1}
              </button>
              <select
                className={styles.bandType}
                aria-label={`Band ${i + 1} type`}
                value={band.type}
                onChange={(e) =>
                  setBands((prev) =>
                    prev.map((b, j) =>
                      j === i ? changeType(b, e.target.value as BandType) : b,
                    ),
                  )
                }
              >
                {(Object.keys(TYPES) as BandType[]).map((type) => (
                  <option key={type} value={type}>
                    {TYPES[type].label}
                  </option>
                ))}
              </select>
            </div>
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
            display={TYPES[band.type].gain ? formatGain(band.gain) : '—'}
            value={band.gain}
            min={GAIN_MIN}
            max={GAIN_MAX}
            step={0.1}
            // The arc grows from the centre, either way.
            startValue={0}
            disabled={!TYPES[band.type].gain}
            onChange={(gain) => updateBand(selected, { gain })}
          />
          <EQKnob
            label="Q"
            display={TYPES[band.type].q ? band.q.toFixed(2) : '—'}
            value={band.q}
            min={Q_MIN}
            max={Q_MAX}
            step={0.01}
            scale={exponentialScale}
            resetValue={DEFAULT_Q[band.type]}
            disabled={!TYPES[band.type].q}
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
