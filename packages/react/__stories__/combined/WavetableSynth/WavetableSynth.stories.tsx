import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AmplitudeEnvelope, Gain, ToneBufferSource } from 'tone'

import { noteNumber, noteToFrequency } from '@tremolo-ui/functions'

import { Piano, Shortcuts } from '../../../src/components/Piano'

import { ADSR } from './ADSR'
import { attackAtom, decayAtom, releaseAtom, sustainAtom } from './atoms'
import { basicShapesWave, WaveSelector } from './WaveSelector'

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
const gain = new Gain().toDestination()

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
        nowBuffering[i] = currentSample * 0.5
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
  const [position, setPosition] = useState(0) // wavetable position
  const audioContext = useRef<AudioContext | null>(null)
  const pressedCount = useRef(0)

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
      gain.set({ gain: 1 / Math.sqrt(Math.max(1, pressedCount.current)) })
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
        }).connect(gain)
      }
    }
  }, [attack, decay, sustain, release])

  const handleStop = (noteNumber: number) => {
    envelopes[noteNumber - firstNote]?.triggerRelease()
    pressedCount.current -= 1
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
        }}
      >
        <WaveSelector position={position} setPosition={setPosition} />
        <ADSR />
      </div>
      <div
        style={{
          height: 160,
          marginTop: '2rem',
        }}
      >
        <Piano
          noteRange={{ first: firstNote, last: lastNote }}
          keyboardShortcuts={Shortcuts.HOME_ROW}
          label={(_, i) => Shortcuts.HOME_ROW.keys[i]?.toUpperCase()}
          onPlayNote={handlePlay}
          onStopNote={handleStop}
        />
      </div>
    </div>
  )
}
