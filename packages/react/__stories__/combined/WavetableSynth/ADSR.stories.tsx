import clsx from 'clsx'
import { useAtom } from 'jotai'

import { clamp, gainToDb, mapValue, mod } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../../../src/components/AnimationCanvas'
import { Knob } from '../../../src/components/Knob'

import {
  attackAtom,
  decayAtom,
  KeyState,
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

export default {
  title: 'combined/ADSR',
  tags: ['!autodocs'],
}

interface Props {
  themeColor?: string
  keyState?: KeyState
}

export function ADSR({ themeColor = 'rgb(67, 170, 248)', keyState }: Props) {
  const [attack, setAttack] = useAtom(attackAtom) // ms
  const [decay, setDecay] = useAtom(decayAtom) // ms
  const [sustain, setSustain] = useAtom(sustainAtom) // %
  const [release, setRelease] = useAtom(releaseAtom) // ms

  return (
    <div className={styles.adsr}>
      <div className={styles.canvas}>
        <AnimationCanvas
          relativeSize
          draw={(ctx, { width, height }) => {
            ctx.clearRect(0, 0, width, height)

            const pad = 10
            const sectionW = (width - pad * 2) / 4
            const x0 = pad
            const y0 = height - pad
            const x1 =
              x0 + mapValue(attack, MIN_ATTACK, MAX_ATTACK, 10, sectionW)
            const y1 = pad
            const x2 = x1 + mapValue(decay, MIN_DECAY, MAX_DECAY, 0, sectionW)
            const y2 = mapValue(
              MAX_SUSTAIN - sustain,
              MIN_SUSTAIN,
              MAX_SUSTAIN,
              pad,
              height - pad,
            )
            const x3 = x2 + sectionW
            const y3 = mapValue(
              MAX_SUSTAIN - sustain,
              MIN_SUSTAIN,
              MAX_SUSTAIN,
              pad,
              height - pad,
            )
            const x4 =
              x3 + mapValue(release, MIN_RELEASE, MAX_RELEASE, 10, sectionW)
            const y4 = height - pad

            // bg shadow
            if (keyState && keyState.timestamp) {
              const msec = performance.now() - keyState.timestamp
              ctx.fillStyle = 'rgb(186, 219, 244)'
              ctx.beginPath()
              let x = 0
              if (keyState.trigger == 'pressed') {
                ctx.moveTo(x0, y0)
                const per = clamp(msec / attack, 0, 1)
                x = x0 + (x1 - x0) * per
                ctx.lineTo(x, y0 + (y1 - y0) * per)
                // ctx.lineTo(x0 + (x1 - x0) * per, height - pad)
                if (msec - attack > 0) {
                  const per = clamp((msec - attack) / decay, 0, 1)
                  x = x1 + (x2 - x1) * per
                  ctx.lineTo(x, y1 + (y2 - y1) * per)
                }
                if (msec - attack - decay > 0) {
                  const per = mod((msec - attack - decay) / 1000, 1)
                  x = x2 + (x3 - x2) * per
                  ctx.lineTo(x, y3)
                }
                ctx.lineTo(x, height - pad)
                ctx.closePath()
                ctx.fill()
              } else {
                if (msec / release < 1) {
                  ctx.moveTo(x3, y3)
                  const per = clamp(msec / release, 0, 1)
                  ctx.lineTo(x3 + (x4 - x3) * per, y3 + (y4 - y2) * per)
                  ctx.lineTo(x3 + (x4 - x3) * per, height - pad)
                  ctx.lineTo(x3, height - pad)
                  ctx.closePath()
                  ctx.fill()
                }
              }
            }

            // line
            ctx.strokeStyle = themeColor
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.lineTo(x3, y3)
            ctx.lineTo(x4, y4)
            ctx.stroke()
          }}
          style={{ background: '#eee' }}
        />
      </div>
      <div className={styles.knobs}>
        <div className={styles.knobAndLabel}>
          <div className={clsx('label', styles.label)}>A</div>
          <Knob
            value={attack}
            min={MIN_ATTACK}
            max={MAX_ATTACK}
            defaultValue={10}
            onChange={(v) => setAttack(v)}
            size={40}
            activeLine={themeColor}
          />
          <div className={clsx('label', styles.label)}>{attack}ms</div>
        </div>
        <div className={styles.knobAndLabel}>
          <div className={clsx('label', styles.label)}>D</div>
          <Knob
            value={decay}
            min={MIN_DECAY}
            max={MAX_DECAY}
            defaultValue={200}
            onChange={(v) => setDecay(v)}
            size={40}
            activeLine={themeColor}
          />
          <div className={clsx('label', clsx('label', styles.label))}>
            {decay}ms
          </div>
        </div>
        <div className={styles.knobAndLabel}>
          <div className={clsx('label', styles.label)}>S</div>
          <Knob
            value={sustain}
            min={MIN_SUSTAIN}
            max={MAX_SUSTAIN}
            defaultValue={50}
            onChange={(v) => setSustain(v)}
            size={40}
            activeLine={themeColor}
          />
          <div className={clsx('label', styles.label)}>
            {gainToDb(sustain / MAX_SUSTAIN) == -Infinity
              ? '-Inf'
              : gainToDb(sustain / MAX_SUSTAIN).toFixed(1)}{' '}
            dB
          </div>
        </div>
        <div className={styles.knobAndLabel}>
          <div className={clsx('label', styles.label)}>R</div>
          <Knob
            value={release}
            min={MIN_RELEASE}
            max={MAX_RELEASE}
            defaultValue={200}
            onChange={(v) => setRelease(v)}
            size={40}
            activeLine={themeColor}
          />
          <div className={clsx('label', styles.label)}>{release}ms</div>
        </div>
      </div>
    </div>
  )
}
