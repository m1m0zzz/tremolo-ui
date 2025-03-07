import { useAtom } from 'jotai'

import { gainToDb } from '@tremolo-ui/functions'

import { Knob } from '../../../src/components/Knob'

import { attackAtom, decayAtom, releaseAtom, sustainAtom } from './atoms'

import styles from './ADSR.module.css'

export function ADSR() {
  const [attack, setAttack] = useAtom(attackAtom) // ms
  const [decay, setDecay] = useAtom(decayAtom) // ms
  const [sustain, setSustain] = useAtom(sustainAtom) // %
  const [release, setRelease] = useAtom(releaseAtom) // ms

  return (
    <div className={styles.adsr}>
      <div className={styles.knobContainer}>
        <div className={styles.label}>A</div>
        <Knob
          value={attack}
          min={10}
          max={1000}
          onChange={(v) => setAttack(v)}
          size={40}
          activeLine="rgb(248, 151, 67)"
        />
        <div className={styles.label}>{attack}ms</div>
      </div>
      <div className={styles.knobContainer}>
        <div className={styles.label}>D</div>
        <Knob
          value={decay}
          min={0}
          max={1000}
          onChange={(v) => setDecay(v)}
          size={40}
          activeLine="rgb(248, 151, 67)"
        />
        <div className={styles.label}>{decay}ms</div>
      </div>
      <div className={styles.knobContainer}>
        <div className={styles.label}>S</div>
        <Knob
          value={sustain}
          min={0}
          max={100}
          onChange={(v) => setSustain(v)}
          size={40}
          activeLine="rgb(248, 151, 67)"
        />
        <div className={styles.label}>
          {gainToDb(sustain / 100) == -Infinity
            ? '-Inf'
            : gainToDb(sustain / 100).toFixed(1)}{' '}
          dB
        </div>
      </div>
      <div className={styles.knobContainer}>
        <div className={styles.label}>R</div>
        <Knob
          value={release}
          min={10}
          max={1000}
          onChange={(v) => setRelease(v)}
          size={40}
          activeLine="rgb(248, 151, 67)"
        />
        <div className={styles.label}>{release}ms</div>
      </div>
    </div>
  )
}
