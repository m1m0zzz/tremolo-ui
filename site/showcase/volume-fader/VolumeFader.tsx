import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

import { curveScale, curveWithCenterValue } from '@tremolo-ui/functions'
import { AnimationCanvas, Slider } from '@tremolo-ui/react'

import { AudioSource } from '../shared/AudioSource'

import styles from './VolumeFader.module.css'

/** The bottom of the fader, which means silence rather than -60 dB. */
const MIN = -60
const MAX = 6
/** -10 dB at the middle of the travel, like the faders of a desk. */
const scale = curveScale(curveWithCenterValue(-10, MIN, MAX))
const MARKS = [6, 0, -5, -10, -20, -30, -40, MIN]

/** One unit of the meter: how many LEDs there are, and the colour of each. */
const SEGMENTS = 40
const segmentColor = (db: number) =>
  db > 0 ? '#ff3b30' : db > -9 ? '#ffcc00' : '#30d158'
/** How long a peak stays lit, and how fast the meter falls, per second. */
const PEAK_HOLD = 1.2
const FALL = 24

const formatDb = (db: number) =>
  db <= MIN ? '-∞' : `${db > 0 ? '+' : ''}${db.toFixed(1)}`

export function VolumeFader() {
  const [volume, setVolume] = useState(0)
  const graphRef = useRef<{ volume: Tone.Volume; meter: Tone.Meter }>(null)
  /** Per channel: the level shown, and the peak with when it was reached. */
  const levels = useRef([
    { level: MIN, peak: MIN, peakTime: 0 },
    { level: MIN, peak: MIN, peakTime: 0 },
  ])

  const applyToAudio = (db: number) => {
    const graph = graphRef.current
    if (!graph) return
    graph.volume.volume.rampTo(db, 0.02)
    graph.volume.mute = db <= MIN
  }

  useEffect(() => applyToAudio(volume), [volume])

  const connect = () => {
    const vol = new Tone.Volume().toDestination()
    // Metered after the fader, as on a channel strip.
    const meter = new Tone.Meter({ channelCount: 2, smoothing: 0 })
    vol.connect(meter)
    graphRef.current = { volume: vol, meter }
    applyToAudio(volume)
    return vol
  }

  return (
    <div className={styles.demo}>
      <AudioSource connect={connect} />
      <div className={styles.strip}>
        <output className={styles.readout}>
          {formatDb(volume)}
          <small> dB</small>
        </output>

        <div className={styles.body}>
          <Slider.Root
            className={styles.root}
            value={volume}
            min={MIN}
            max={MAX}
            scale={scale}
            step={0.1}
            orientation="vertical"
            wheel={['normalized', 0.02]}
            aria-label="Volume"
            aria-valuetext={`${formatDb(volume)} dB`}
            onChange={setVolume}
            // Back to unity gain, as a desk does on a double click.
            onDoubleClick={() => setVolume(0)}
          >
            <Slider.Track className={styles.track}>
              <Slider.Thumb className={styles.cap} />
            </Slider.Track>
            <Slider.Marks className={styles.marks}>
              {MARKS.map((db) => (
                <Slider.MarksOption
                  key={db}
                  value={db}
                  label={db <= MIN ? '∞' : db > 0 ? `+${db}` : db}
                  className={styles.marksOption}
                  classes={{ mark: styles.mark, label: styles.label }}
                />
              ))}
            </Slider.Marks>
          </Slider.Root>

          {/* The same height and the same scale as the fader, so the marks
              read on both. */}
          <div className={styles.meter}>
            <AnimationCanvas
              resizable
              draw={(ctx, { width, height, deltaTime }) => {
                ctx.clearRect(0, 0, width, height)
                const meter = graphRef.current?.meter
                const values = meter
                  ? (meter.getValue() as number[])
                  : [-Infinity, -Infinity]
                const now = performance.now() / 1000
                const gap = 2
                const barWidth = (width - gap) / 2
                const segmentHeight = height / SEGMENTS

                values.forEach((value, channel) => {
                  const state = levels.current[channel]
                  // Rises at once, falls at a steady rate.
                  state.level = Math.max(
                    value,
                    state.level - FALL * (deltaTime / 1000),
                  )
                  if (value >= state.peak || now - state.peakTime > PEAK_HOLD) {
                    state.peak = value
                    state.peakTime = now
                  }

                  const x = channel * (barWidth + gap)
                  const lit =
                    scale.normalize(Math.max(state.level, MIN), MIN, MAX) *
                    SEGMENTS
                  const peak = Math.floor(
                    scale.normalize(Math.max(state.peak, MIN), MIN, MAX) *
                      SEGMENTS,
                  )
                  for (let i = 0; i < SEGMENTS; i++) {
                    const db = scale.denormalize((i + 0.5) / SEGMENTS, MIN, MAX)
                    const on = i < lit || (i === peak && state.peak > MIN)
                    ctx.globalAlpha = on ? 1 : 0.12
                    ctx.fillStyle = segmentColor(db)
                    ctx.fillRect(
                      x,
                      height - (i + 1) * segmentHeight + 1,
                      barWidth,
                      segmentHeight - 2,
                    )
                  }
                })
                ctx.globalAlpha = 1
              }}
            />
          </div>
        </div>

        <span className={styles.name}>MASTER</span>
      </div>
    </div>
  )
}
