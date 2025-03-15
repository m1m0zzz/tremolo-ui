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
  voiceDetuneAtom,
  MIN_VOICE_DETUNE,
  MAX_VOICE_DETUNE,
} from './atoms'

import styles from './MasterSection.module.css'

export default {
  title: 'combined/MasterSection',
  tags: ['!autodocs'],
}

interface Props {
  themeColor?: string
}

export function MasterSection({ themeColor = 'rgb(67, 170, 248)' }: Props) {
  const [masterVolume, setMasterVolume] = useAtom(masterVolumeAtom)
  const [voice, setVoice] = useAtom(voiceAtom)
  const [voiceDetune, setVoiceDetune] = useAtom(voiceDetuneAtom)

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
          size={30}
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
        }}
      >
        <div className="label">Voice</div>
        <Knob
          value={voice}
          min={MIN_VOICE}
          max={MAX_VOICE}
          onChange={(v) => setVoice(v)}
          size={30}
          activeLine={themeColor}
        />
        <div className="label">{voice}</div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div className="label">Detune</div>
        <Knob
          value={voiceDetune}
          min={MIN_VOICE_DETUNE}
          max={MAX_VOICE_DETUNE}
          onChange={(v) => setVoiceDetune(v)}
          size={30}
          activeLine={voice > 1 ? themeColor : 'rgb(159, 166, 187)'}
        />
        <div className="label">{voiceDetune}</div>
      </div>
    </div>
  )
}
