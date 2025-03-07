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
const gain = new Gain().toDestination()

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
        console.log('init audio context')
        console.log(ctx)
        audioContext.current = ctx
      }

      const myArrayBuffer = ctx.createBuffer(2, sampleRate, sampleRate)

      let currentAngle = 0
      const cyclesPerSample = noteToFrequency(noteNumber) / sampleRate
      for (
        let channel = 0;
        channel < myArrayBuffer.numberOfChannels;
        channel++
      ) {
        const nowBuffering = myArrayBuffer.getChannelData(channel)
        for (let i = 0; i < myArrayBuffer.length; i++) {
          const currentSample = basicShapesWave(currentAngle, position)
          currentAngle += cyclesPerSample
          nowBuffering[i] = currentSample * 0.5
        }
      }

      const source = new ToneBufferSource({
        url: myArrayBuffer,
        loop: true,
        loopEnd: 1 / noteToFrequency(noteNumber),
      })

      pressedCount.current += 1

      for (let i = 0; i < noteLength; i++) {
        if (firstNote + i == noteNumber) {
          source.connect(envelopes[i])
          source.start()
          envelopes[i].triggerAttack()
          gain.set({ gain: 1 / Math.sqrt(Math.min(1, pressedCount.current)) })
        }
      }
    },
    [position, audioContext],
  )

  useEffect(() => {
    for (let i = 0; i < noteLength; i++) {
      envelopes[i] = new AmplitudeEnvelope({
        attack: attack / 1000,
        decay: decay / 1000,
        sustain: sustain / 100,
        release: release / 1000,
      }).connect(gain)
    }
  }, [attack, decay, sustain, release])

  const handleStop = (noteNumber: number) => {
    // console.log('stop: ', noteNumber)
    for (let i = 0; i < noteLength; i++) {
      if (firstNote + i == noteNumber) {
        envelopes[i]?.triggerRelease()
      }
    }
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
