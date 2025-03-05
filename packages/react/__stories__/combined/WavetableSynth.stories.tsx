import { useCallback, useState } from 'react'

import { noteNumber, noteToFrequency } from '@tremolo-ui/functions'

import { Piano, Shortcuts } from '../../src/components/Piano'

import { ADSR } from './components/ADSR'
import { basicShapesWave, WaveSelector } from './components/WaveSelector'

export default {
  title: 'combined/WavetableSynth',
  tags: ['!autodocs'],
}

const sampleRate = 48000

export const WavetableSynth = () => {
  const [position, setPosition] = useState(0) // wavetable position
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)

  const handlePlay = useCallback(
    (noteNumber: number) => {
      let ctx
      if (audioContext) {
        ctx = audioContext
      } else {
        ctx = new AudioContext()
        console.log(ctx)
        setAudioContext(ctx)
      }

      const myArrayBuffer = ctx.createBuffer(2, sampleRate * 1, sampleRate)

      console.log(myArrayBuffer.numberOfChannels)
      let currentAngle = 0
      const cyclesPerSample = noteToFrequency(noteNumber) / sampleRate
      // const angleDelta = cyclesPerSample * 2 * Math.PI
      for (
        let channel = 0;
        channel < myArrayBuffer.numberOfChannels;
        channel++
      ) {
        const nowBuffering = myArrayBuffer.getChannelData(channel)
        for (let i = 0; i < myArrayBuffer.length; i++) {
          const currentSample = basicShapesWave(currentAngle, position)
          currentAngle += cyclesPerSample
          nowBuffering[i] = currentSample
        }
      }

      const source = ctx.createBufferSource()
      source.buffer = myArrayBuffer
      source.connect(ctx.destination)
      source.start()
      console.log('play')
    },
    [position],
  )

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
          noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
          // fill={true}
          keyboardShortcuts={Shortcuts.HOME_ROW}
          label={(_, i) => Shortcuts.HOME_ROW.keys[i]?.toUpperCase()}
          onPlayNote={handlePlay}
        />
      </div>
    </div>
  )
}
