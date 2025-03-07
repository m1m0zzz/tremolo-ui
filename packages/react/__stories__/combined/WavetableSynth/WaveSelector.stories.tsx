import { useAtom } from 'jotai'

import { clamp } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../../../src/components/AnimationCanvas'
import { NumberInput } from '../../../src/components/NumberInput'
import {
  Slider,
  SliderThumb,
  SliderTrack,
} from '../../../src/components/Slider'

import { positionAtom } from './atoms'
import {
  generateWaveWithFunction,
  sin,
  triangle,
  saw,
  pulse,
  middleWave,
} from './wavetable'

import style from './WaveSelector.module.css'

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

export default {
  title: 'combined/WaveSelector',
  tags: ['!autodocs'],
}

export const WaveSelector = ({
  themeColor = 'rgb(67, 170, 248)',
}: {
  themeColor?: string
}) => {
  const [position, setPosition] = useAtom(positionAtom)

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
              ctx.strokeStyle = themeColor
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
            active={themeColor}
          ></SliderTrack>
          <SliderThumb>
            <div
              style={{
                border: `solid 4px ${themeColor}`,
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
