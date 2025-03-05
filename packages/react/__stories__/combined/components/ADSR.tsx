import { useState } from 'react'

import { Knob } from '../../../src/components/Knob'

import styles from './ADSR.module.css'

export function ADSR() {
  const [attack, setAttack] = useState(100) // ms
  const [decay, setDecay] = useState(200) // ms
  const [sustain, setSustain] = useState(80) // %
  const [release, setRelease] = useState(200) // ms

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
        <div className={styles.label}>{sustain}%</div>
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
