import { useAtom } from 'jotai'

import { skewWithCenterValue } from '@tremolo-ui/functions'

import { Knob } from '../../../src/components/Knob'

import {
  masterVolumeAtom,
  MIN_MASTER_VOLUME,
  MAX_MASTER_VOLUME,
  voiceAtom,
  MAX_VOICE,
  MIN_VOICE,
} from './atoms'

import styles from './MasterSection.module.css'

interface Props {
  themeColor?: string
}

export function MasterSection({ themeColor = 'rgb(67, 170, 248)' }: Props) {
  const [masterVolume, setMasterVolume] = useAtom(masterVolumeAtom)
  const [voice, setVoice] = useAtom(voiceAtom)

  return (
    <div className={styles.container}>
      <div className={styles.knob}>
        <div className="label">Master</div>
        <Knob
          value={masterVolume}
          min={MIN_MASTER_VOLUME}
          max={MAX_MASTER_VOLUME}
          defaultValue={0}
          onChange={(v) => setMasterVolume(v)}
          size={40}
          skew={skewWithCenterValue(-12, MIN_MASTER_VOLUME, MAX_MASTER_VOLUME)}
          step={0.1}
          activeLine={themeColor}
        />
        <div className="label" style={{ width: 55 }}>
          {masterVolume <= MIN_MASTER_VOLUME ? '-Inf' : masterVolume} dB
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <div className="label">Voice</div>
        <Knob
          value={voice}
          min={MIN_VOICE}
          max={MAX_VOICE}
          onChange={(v) => setVoice(v)}
          size={40}
          activeLine={themeColor}
        />
        <div className="label">{voice}</div>
      </div>
    </div>
  )
}
