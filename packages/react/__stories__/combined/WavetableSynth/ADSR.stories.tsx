import { useAtom } from 'jotai'

import { gainToDb } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../../../src/components/AnimationCanvas'
import { Knob } from '../../../src/components/Knob'

import {
  attackAtom,
  decayAtom,
  MAX_ATTACK,
  MAX_DECAY,
  MAX_RELEASE,
  MAX_SUSTAIN,
  MIN_ATTACK,
  MIN_DECAY,
  MIN_RELEASE,
  MIN_SUSTAIN,
  releaseAtom,
  sustainAtom,
} from './atoms'

import styles from './ADSR.module.css'

function mappingValue(
  value: number,
  beforeMin: number,
  beforeMax: number,
  afterMin: number,
  afterMax: number,
) {
  return (
    afterMin +
    ((value - beforeMin) / (beforeMax - beforeMin)) * (afterMax - afterMin)
  )
}

export default {
  title: 'combined/ADSR',
  tags: ['!autodocs'],
}

export function ADSR({
  themeColor = 'rgb(67, 170, 248)',
}: {
  themeColor?: string
}) {
  const [attack, setAttack] = useAtom(attackAtom) // ms
  const [decay, setDecay] = useAtom(decayAtom) // ms
  const [sustain, setSustain] = useAtom(sustainAtom) // %
  const [release, setRelease] = useAtom(releaseAtom) // ms

  return (
    <div className={styles.adsr}>
      <div className={styles.canvas}>
        <AnimationCanvas
          relativeSize
          draw={(ctx, _w, _h) => {
            const w = _w.current
            const h = _h.current
            ctx.clearRect(0, 0, w, h)

            const pad = 10
            const sectionW = (w - pad * 2) / 4
            ctx.strokeStyle = themeColor
            ctx.lineWidth = 2
            let x = pad
            ctx.beginPath()
            ctx.moveTo(pad, h - pad)
            x += mappingValue(attack, MIN_ATTACK, MAX_ATTACK, 20, sectionW)
            ctx.lineTo(x, pad)
            x += mappingValue(decay, MIN_DECAY, MAX_DECAY, 0, sectionW)
            ctx.lineTo(
              x,
              mappingValue(
                MAX_SUSTAIN - sustain,
                MIN_SUSTAIN,
                MAX_SUSTAIN,
                pad,
                h - pad,
              ),
            )
            x += sectionW
            ctx.lineTo(
              x,
              mappingValue(
                MAX_SUSTAIN - sustain,
                MIN_SUSTAIN,
                MAX_SUSTAIN,
                pad,
                h - pad,
              ),
            )
            x += mappingValue(release, MIN_RELEASE, MAX_RELEASE, 20, sectionW)
            ctx.lineTo(x, h - pad)
            ctx.stroke()
          }}
          style={{ background: '#eee' }}
        />
      </div>
      <div className={styles.knobs}>
        <div className={styles.knobAndLabel}>
          <div className={styles.label}>A</div>
          <Knob
            value={attack}
            min={MIN_ATTACK}
            max={MAX_ATTACK}
            onChange={(v) => setAttack(v)}
            size={40}
            activeLine={themeColor}
          />
          <div className={styles.label}>{attack}ms</div>
        </div>
        <div className={styles.knobAndLabel}>
          <div className={styles.label}>D</div>
          <Knob
            value={decay}
            min={MIN_DECAY}
            max={MAX_DECAY}
            onChange={(v) => setDecay(v)}
            size={40}
            activeLine={themeColor}
          />
          <div className={styles.label}>{decay}ms</div>
        </div>
        <div className={styles.knobAndLabel}>
          <div className={styles.label}>S</div>
          <Knob
            value={sustain}
            min={MIN_SUSTAIN}
            max={MAX_SUSTAIN}
            onChange={(v) => setSustain(v)}
            size={40}
            activeLine={themeColor}
          />
          <div className={styles.label}>
            {gainToDb(sustain / MAX_SUSTAIN) == -Infinity
              ? '-Inf'
              : gainToDb(sustain / MAX_SUSTAIN).toFixed(1)}{' '}
            dB
          </div>
        </div>
        <div className={styles.knobAndLabel}>
          <div className={styles.label}>R</div>
          <Knob
            value={release}
            min={MIN_RELEASE}
            max={MAX_RELEASE}
            onChange={(v) => setRelease(v)}
            size={40}
            activeLine={themeColor}
          />
          <div className={styles.label}>{release}ms</div>
        </div>
      </div>
    </div>
  )
}
