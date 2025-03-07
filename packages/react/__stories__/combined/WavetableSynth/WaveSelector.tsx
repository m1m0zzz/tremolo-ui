import { Dispatch, SetStateAction } from 'react'

import { clamp, mod } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../../../src/components/AnimationCanvas'
import { NumberInput } from '../../../src/components/NumberInput'
import {
  Slider,
  SliderThumb,
  SliderTrack,
} from '../../../src/components/Slider'

import style from './WaveSelector.module.css'

function generateWaveWithFunction(
  sampleLength: number,
  fn: (t: number) => number,
) {
  const wave = []
  for (let i = 0; i < sampleLength; i++) {
    wave.push(fn(i / sampleLength))
  }
  return wave
}

function sin(t: number) {
  return Math.sin(2 * Math.PI * t)
}

function triangle(t: number) {
  t = mod(t, 1)
  if (t <= 0.25) {
    return 4 * t
  } else if (t <= 0.75) {
    return 2 - 4 * t
  } else {
    return -4 + 4 * t
  }
}

function saw(t: number) {
  t = mod(t, 1)
  if (t <= 0.5) {
    return 2 * t
  } else {
    return -2 + 2 * t
  }
}

function pulse(t: number) {
  t = mod(t, 1)
  return t <= 0.5 ? 1 : -1
}

export function basicShapesWave(t: number, pos = 0) {
  pos = clamp(pos, 0, 100)
  function middle(
    f1: (t: number) => number,
    f2: (t: number) => number,
    percent: number,
  ) {
    return f1(t) * (1 - percent) + f2(t) * percent
  }

  if (pos <= 33) {
    return middle(sin, triangle, pos / 33)
  } else if (pos <= 67) {
    return middle(triangle, saw, (pos - 33) / (67 - 33))
  } else {
    return middle(saw, pulse, (pos - 67) / (100 - 67))
  }
}

function middleWave(wave1: number[], wave2: number[], percent: number) {
  if (wave1.length != wave2.length) throw new Error()
  const m = []
  for (let j = 0; j < wave1.length; j++) {
    m.push(wave1[j] * (1 - percent) + wave2[j] * percent)
  }
  return m
}

const sampleLength = 100
const frameLength = 100

const sineWave = generateWaveWithFunction(sampleLength, sin)
const triangleWave = generateWaveWithFunction(sampleLength, triangle)
const sawWave = generateWaveWithFunction(sampleLength, saw)
const pulseWave = generateWaveWithFunction(sampleLength, pulse)
const wavetable: Array<Array<number>> = []

for (let i = 0; i < frameLength; i++) {
  if (i == 0) {
    wavetable.push(sineWave)
  } else if (i <= 33) {
    wavetable.push(middleWave(sineWave, triangleWave, i / 33))
  } else if (i <= 67) {
    wavetable.push(middleWave(triangleWave, sawWave, (i - 33) / (67 - 33)))
  } else {
    wavetable.push(middleWave(sawWave, pulseWave, (i - 67) / (100 - 67)))
  }
}

// const keyframe = {
//   0: sineWave,
//   33: triangleWave,
//   67: sawWave,
//   100: pulseWave
// }

interface Props {
  position: number
  setPosition: Dispatch<SetStateAction<number>>
}

export const WaveSelector = ({ position, setPosition }: Props) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: 'min-content',
        height: 200,
      }}
    >
      <Slider
        value={position}
        min={0}
        max={100}
        onChange={(v) => setPosition(v)}
        vertical
        style={{
          margin: 0,
        }}
      >
        <SliderTrack defaultStyle={false}>
          <AnimationCanvas
            width={200}
            height={200}
            draw={(ctx, _w, _h) => {
              const padX = 10
              const padY = 21
              const w = _w.current
              const h = _h.current
              const v = clamp(position, 0, 100)
              ctx.clearRect(0, 0, w, h)
              ctx.lineWidth = 2
              function drawWave(wave: number[], pos: number) {
                ctx.beginPath()
                for (let i = 0; i < wave.length; i++) {
                  const sig = wave[i]
                  const arg: [number, number] = [
                    padX + ((w - padX * 2) * i) / wave.length,
                    padY + (h - padY * 2) * (100 - pos) * 0.01 - sig * 18,
                  ]
                  if (i == 0) {
                    ctx.moveTo(...arg)
                  } else {
                    ctx.lineTo(...arg)
                  }
                }
                ctx.stroke()
              }
              // draw wave placeholder
              ctx.strokeStyle = '#e0e0e0'
              drawWave(sineWave, 0)
              drawWave(triangleWave, 33)
              drawWave(sawWave, 67)
              drawWave(pulseWave, 100)
              // draw wave
              ctx.strokeStyle = 'rgb(248, 151, 67)'
              drawWave(wavetable[Math.floor((v / 100) * (frameLength - 1))], v)
            }}
          />
        </SliderTrack>
        <SliderThumb>
          <></>
        </SliderThumb>
      </Slider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Slider
          value={position}
          min={0}
          max={100}
          onChange={(v) => setPosition(v)}
          vertical
          style={{
            width: 'min-content',
            height: 'calc(100% - 1rem)',
            margin: 10,
          }}
        >
          <SliderTrack
            thickness={6}
            length="100%"
            active="rgb(248, 151, 67)"
          ></SliderTrack>
          <SliderThumb>
            <div
              style={{
                border: 'solid 4px rgb(248, 151, 67)',
                background: 'white',
                borderRadius: '50%',
                width: 12,
                height: 12,
              }}
            ></div>
          </SliderThumb>
        </Slider>
        <NumberInput
          value={position}
          onBlur={(v) => setPosition(v)}
          units="%"
          min={0}
          max={100}
          className={style.numberInput}
          wrapperClassName={style.numberInputWrapper}
        />
      </div>
    </div>
  )
}
