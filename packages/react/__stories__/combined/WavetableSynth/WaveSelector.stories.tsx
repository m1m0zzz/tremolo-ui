import { useAtom } from 'jotai'

import { clamp } from '@tremolo-ui/functions'

import { AnimationCanvas } from '../../../src/components/AnimationCanvas'
import { NumberInput } from '../../../src/components/NumberInput'
import { Slider } from '../../../src/components/Slider'

import {
  detuneAtom,
  MAX_DETUNE,
  MAX_SEMITONE,
  MIN_DETUNE,
  MIN_SEMITONE,
  positionAtom,
  semitoneAtom,
} from './atoms'
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
  const [semitone, setSemitone] = useAtom(semitoneAtom)
  const [detune, setDetune] = useAtom(detuneAtom)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: 'min-content',
        height: 200,
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
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
          <Slider.Track defaultStyle={false} style={{ height: 170 }}>
            <AnimationCanvas
              width={180}
              height={170}
              draw={(ctx, { width, height }) => {
                const padX = 10
                const padY = 21
                const v = clamp(position, 0, 100)
                ctx.clearRect(0, 0, width, height)
                ctx.lineWidth = 2
                function drawWave(wave: number[], pos: number) {
                  ctx.beginPath()
                  for (let i = 0; i < wave.length; i++) {
                    const sig = wave[i]
                    const arg: [number, number] = [
                      padX + ((width - padX * 2) * i) / wave.length,
                      padY +
                        (height - padY * 2) * (100 - pos) * 0.01 -
                        sig * 18,
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
                drawWave(
                  wavetable[Math.floor((v / 100) * (frameLength - 1))],
                  v,
                )
              }}
            />
          </Slider.Track>
          <Slider.Thumb>
            <></>
          </Slider.Thumb>
        </Slider>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <div>
            <span className="label">Semi: </span>
            <NumberInput
              value={semitone}
              min={MIN_SEMITONE}
              max={MAX_SEMITONE}
              units={'st'}
              selectWithFocus="number"
              variant="flushed"
              activeColor={themeColor}
              className={style.numberInput}
              wrapperClassName={style.numberInputWrapper}
              onBlur={(v) => setSemitone(v)}
            />
          </div>
          <div>
            <span className="label">Det: </span>
            <NumberInput
              value={detune}
              min={MIN_DETUNE}
              max={MAX_DETUNE}
              units={'ct'}
              selectWithFocus="number"
              variant="flushed"
              activeColor={themeColor}
              className={style.numberInput}
              wrapperClassName={style.numberInputWrapper}
              onBlur={(v) => setDetune(v)}
            />
          </div>
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
          <Slider.Track
            thickness={6}
            length="100%"
            active={themeColor}
          ></Slider.Track>
          <Slider.Thumb>
            <div
              style={{
                border: `solid 4px ${themeColor}`,
                background: 'white',
                borderRadius: '50%',
                width: 12,
                height: 12,
              }}
            ></div>
          </Slider.Thumb>
        </Slider>
        <NumberInput
          value={position}
          min={0}
          max={100}
          units="%"
          selectWithFocus="number"
          variant="flushed"
          activeColor={themeColor}
          className={style.numberInput}
          wrapperClassName={style.numberInputWrapper}
          onBlur={(v) => setPosition(v)}
        />
      </div>
    </div>
  )
}
