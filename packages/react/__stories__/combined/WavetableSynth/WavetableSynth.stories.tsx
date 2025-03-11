import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AmplitudeEnvelope,
  FFT,
  gainToDb,
  getDestination,
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
  detuneAtom,
  KeyState,
  masterVolumeAtom,
  positionAtom,
  releaseAtom,
  semitoneAtom,
  sustainAtom,
} from './atoms'
import { MasterSection } from './MasterSection'
import { SpectrumAnalyzer } from './SpectrumAnalyzer'
import { VolumeMeter } from './VolumeMeter'
import { WaveSelector } from './WaveSelector.stories'
import { basicShapesWave } from './wavetable'

import './index.css'
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
  semitone?: number
  detune?: number
}[] = []
const volume = new Volume(0)
const masterVolume = new Volume()
const meter = new Meter()
const fft = new FFT()
volume.chain(masterVolume, meter, fft, getDestination())

function generateAndAssignSource(
  ctx: AudioContext,
  noteNumber: number,
  position: number,
  semitone: number,
  detune: number,
) {
  const nodeIndex = noteNumber - firstNote
  if (
    sources[nodeIndex]?.position != position ||
    sources[nodeIndex]?.semitone != semitone ||
    sources[nodeIndex]?.detune != detune
  ) {
    const freq = noteToFrequency(noteNumber + semitone, detune)
    console.log(semitone, detune, freq)
    const buffer = ctx.createBuffer(2, Math.ceil(sampleRate / freq), sampleRate)
    let currentAngle = 0
    const cyclesPerSample = freq / sampleRate
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
      loopEnd: 1 / freq,
    })
    source.connect(envelopes[nodeIndex])
    if (source.state == 'stopped') {
      source.start()
    }
    sources[nodeIndex] = {
      source: source,
      position: position,
      semitone: semitone,
      detune: detune,
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
  const semitone = useAtomValue(semitoneAtom)
  const detune = useAtomValue(detuneAtom)
  const attack = useAtomValue(attackAtom)
  const decay = useAtomValue(decayAtom)
  const sustain = useAtomValue(sustainAtom)
  const release = useAtomValue(releaseAtom)
  const masterDb = useAtomValue(masterVolumeAtom)

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
      generateAndAssignSource(ctx, noteNumber, position, semitone, detune)

      envelopes[noteNumber - firstNote].triggerAttack()
      volume.volume.rampTo(
        gainToDb(1 / Math.sqrt(Math.max(1, pressedCount.current))),
        0.001,
      )

      setKeyState({
        trigger: 'pressed',
        timestamp: performance.now(),
      })
    },
    [position, semitone, detune, audioContext],
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

  useEffect(() => {
    masterVolume.volume.value = masterDb
  }, [masterDb])

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
        <MasterSection />
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
