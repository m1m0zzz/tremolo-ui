import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AmplitudeEnvelope,
  FFT,
  gainToDb,
  Meter,
  ToneBufferSource,
  Volume,
} from 'tone'

import { noteNumber, noteToFrequency } from '@tremolo-ui/functions'

import { Piano, Shortcuts } from '../../../src/components/Piano'

import { ADSR } from './ADSR.stories'
import {
  attackAtom,
  decayAtom,
  KeyState,
  positionAtom,
  releaseAtom,
  sustainAtom,
} from './atoms'
import { SpectrumAnalyzer } from './SpectrumAnalyzer'
import { VolumeMeter } from './VolumeMeter'
import { WaveSelector } from './WaveSelector.stories'
import { basicShapesWave } from './wavetable'

import styles from './WavetableSynth.module.css'

export default {
  title: 'combined/WavetableSynth',
  tags: ['!autodocs'],
}

const sampleRate = 48000

const firstNote = noteNumber('C3')
const lastNote = noteNumber('B4')
const noteLength = lastNote - firstNote + 1
const envelopes: AmplitudeEnvelope[] = []
const sources: {
  source: ToneBufferSource
  position?: number
}[] = []
const volume = new Volume(0)
const meter = new Meter()
const fft = new FFT()
volume.connect(meter).connect(fft).toDestination()

function generateAndAssignSource(
  ctx: AudioContext,
  noteNumber: number,
  position: number,
) {
  const nodeIndex = noteNumber - firstNote
  if (sources[nodeIndex]?.position != position) {
    const buffer = ctx.createBuffer(2, sampleRate, sampleRate)
    let currentAngle = 0
    const cyclesPerSample = noteToFrequency(noteNumber) / sampleRate
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const nowBuffering = buffer.getChannelData(channel)
      for (let i = 0; i < buffer.length; i++) {
        const currentSample = basicShapesWave(currentAngle, position)
        currentAngle += cyclesPerSample
        nowBuffering[i] = currentSample
      }
    }
    if (sources[nodeIndex]?.source?.state == 'started') {
      sources[nodeIndex].source.stop()
    }
    const source = new ToneBufferSource({
      url: buffer,
      loop: true,
      loopEnd: 1 / noteToFrequency(noteNumber),
    })
    source.connect(envelopes[nodeIndex])
    if (source.state == 'stopped') {
      source.start()
    }
    sources[nodeIndex] = {
      source: source,
      position: position,
    }
  }
}

export const WavetableSynth = () => {
  const audioContext = useRef<AudioContext | null>(null)
  const pressedCount = useRef(0)
  const [keyState, setKeyState] = useState<KeyState>({
    trigger: 'release',
  })

  const position = useAtomValue(positionAtom)
  const attack = useAtomValue(attackAtom)
  const decay = useAtomValue(decayAtom)
  const sustain = useAtomValue(sustainAtom)
  const release = useAtomValue(releaseAtom)

  const handlePlay = useCallback(
    (noteNumber: number) => {
      let ctx
      if (audioContext.current) {
        ctx = audioContext.current
      } else {
        ctx = new AudioContext({ sampleRate: sampleRate })
        audioContext.current = ctx
      }

      pressedCount.current += 1
      generateAndAssignSource(ctx, noteNumber, position)

      envelopes[noteNumber - firstNote].triggerAttack()
      volume.volume.value = gainToDb(
        1 / Math.sqrt(Math.max(1, pressedCount.current)),
      )

      setKeyState({
        trigger: 'pressed',
        timestamp: performance.now(),
      })
    },
    [position, audioContext],
  )

  useEffect(() => {
    const a = attack / 1000
    const d = decay / 1000
    const s = sustain / 100
    const r = release / 1000
    for (let i = 0; i < noteLength; i++) {
      if (envelopes[i]) {
        envelopes[i].attack = a
        envelopes[i].decay = d
        envelopes[i].sustain = s
        envelopes[i].release = r
      } else {
        envelopes[i] = new AmplitudeEnvelope({
          attack: a,
          decay: d,
          sustain: s,
          release: r,
        }).connect(volume)
      }
    }
  }, [attack, decay, sustain, release])

  const handleStop = (noteNumber: number) => {
    envelopes[noteNumber - firstNote]?.triggerRelease()
    pressedCount.current -= 1
    if (pressedCount.current <= 0) {
      setKeyState({
        trigger: 'release',
        timestamp: performance.now(),
      })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.heading}>Wavetable</p>
        <div className={styles.header_right}>
          <SpectrumAnalyzer fft={fft} />
          <VolumeMeter meter={meter} />
        </div>
      </div>
      <div className={styles.parameters}>
        <WaveSelector />
        <ADSR keyState={keyState} />
      </div>
      <div className={styles.piano}>
        <Piano
          noteRange={{ first: firstNote, last: lastNote }}
          keyboardShortcuts={Shortcuts.HOME_ROW}
          label={(_, i) => Shortcuts.HOME_ROW.keys[i]?.toUpperCase()}
          height={120}
          onPlayNote={handlePlay}
          onStopNote={handleStop}
        />
      </div>
    </div>
  )
}
