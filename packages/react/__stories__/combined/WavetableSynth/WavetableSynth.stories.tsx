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
  MIN_VOICE,
  positionAtom,
  releaseAtom,
  semitoneAtom,
  sustainAtom,
  voiceAtom,
  voiceDetuneAtom,
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
const sourcesMemo: {
  sources: ToneBufferSource[]
  position?: number
  semitone?: number
  detune?: number
  voice?: number
  voiceDetune?: number
}[] = []
const volume = new Volume(0)
const masterVolume = new Volume()
const meter = new Meter()
const fft = new FFT()
volume.chain(masterVolume, meter, fft, getDestination())

function detunedVoices(voice: number, detune: number) {
  const DETUNE_WIDTH = 50
  const voices = []
  const top = Array(Math.floor(voice / 2))
    .fill(0)
    .map((_, i) => (DETUNE_WIDTH * detune) / (i + 1))
  const bottom = top.map((v) => -v).toReversed()
  if (voice % 2 == 0) {
    voices.push(...top, ...bottom)
  } else {
    voices.push(...top, 0, ...bottom)
  }
  return voices
}

function generateAndAssignSource(
  ctx: AudioContext,
  noteNumber: number,
  position: number,
  semitone: number,
  detune: number,
  voice: number,
  voiceDetune: number,
) {
  const noteIndex = noteNumber - firstNote
  if (
    sourcesMemo[noteIndex]?.position == position &&
    sourcesMemo[noteIndex]?.semitone == semitone &&
    sourcesMemo[noteIndex]?.detune == detune &&
    sourcesMemo[noteIndex]?.voice == voice &&
    sourcesMemo[noteIndex]?.voiceDetune == voiceDetune
  )
    return

  const sources = []
  for (let v = MIN_VOICE; v <= voice; v++) {
    const d = detunedVoices(voice, voiceDetune / 100)[v - MIN_VOICE]
    const freq = noteToFrequency(noteNumber + semitone, detune + d)
    const buffer = ctx.createBuffer(2, Math.ceil(sampleRate / freq), sampleRate)
    let currentAngle = v == 1 ? 0 : Math.random()
    const cyclesPerSample = freq / sampleRate
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const nowBuffering = buffer.getChannelData(channel)
      for (let i = 0; i < buffer.length; i++) {
        const currentSample = basicShapesWave(currentAngle, position)
        currentAngle += cyclesPerSample
        nowBuffering[i] = currentSample / Math.sqrt(voice)
      }
    }
    // stop all source
    for (let s = 0; s < sourcesMemo[noteIndex]?.sources.length; s++) {
      const source = sourcesMemo[noteIndex]?.sources[s]
      if (source.state == 'started') source.stop()
    }
    const source = new ToneBufferSource({
      url: buffer,
      loop: true,
      loopEnd: 1 / freq,
    })
    source.connect(envelopes[noteIndex])
    source.start()
    sources.push(source)
  }
  sourcesMemo[noteIndex] = {
    sources: sources,
    position: position,
    semitone: semitone,
    detune: detune,
    voice: voice,
    voiceDetune: voiceDetune,
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
  const voice = useAtomValue(voiceAtom)
  const voiceDetune = useAtomValue(voiceDetuneAtom)

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
      generateAndAssignSource(
        ctx,
        noteNumber,
        position,
        semitone,
        detune,
        voice,
        voiceDetune,
      )

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
    [position, semitone, detune, voice, voiceDetune, audioContext],
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
