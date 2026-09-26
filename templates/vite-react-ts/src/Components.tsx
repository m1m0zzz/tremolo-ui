import { useEffect, useState } from 'react'

import { type XY } from '@tremolo-ui/dom'
import { noteName, noteNumber } from '@tremolo-ui/functions'
import {
  AnimationCanvas,
  Knob,
  NumberInput,
  Piano,
  Slider,
  XYPad,
} from '@tremolo-ui/react'

import { Card } from './components/Card.tsx'

import knobTheme from './theme/Knob.module.css'
import numberInputTheme from './theme/NumberInput.module.css'
import pianoTheme from './theme/Piano.module.css'
import sliderTheme from './theme/Slider.module.css'
import xyPadTheme from './theme/XYPad.module.css'

export function Components() {
  const [value, setValue] = useState(64)
  const [xy, setXY] = useState<XY<number>>([32, 56])
  const [note, setNote] = useState<number | null>(null)

  // The theme reads `[data-theme='dark']` on an ancestor. This app follows the
  // system setting instead, so mirror it onto <html>.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  return (
    <>
      <Card title="Knob">
        <Knob.Root
          className={knobTheme.root}
          aria-label="Level"
          value={value}
          min={0}
          max={100}
          onChange={setValue}
        >
          <Knob.SVGRoot>
            <Knob.ActiveLine className={knobTheme.activeLine} />
            <Knob.InactiveLine className={knobTheme.inactiveLine} />
            <Knob.Thumb
              className={knobTheme.thumb}
              classes={{ thumbLine: knobTheme.thumbLine }}
            />
          </Knob.SVGRoot>
        </Knob.Root>
        <p>value: {value}</p>
      </Card>

      <Card title="Slider">
        <Slider.Root
          className={sliderTheme.root}
          value={value}
          min={0}
          max={100}
          onChange={setValue}
        >
          <Slider.Track className={sliderTheme.track}>
            <Slider.Thumb className={sliderTheme.thumb} aria-label="Level" />
          </Slider.Track>
        </Slider.Root>
        <p>value: {value}</p>
      </Card>

      <Card title="NumberInput">
        <NumberInput.Root
          className={numberInputTheme.root}
          value={value}
          min={0}
          max={100}
          onChange={setValue}
        >
          <NumberInput.InputField
            className={numberInputTheme.field}
            aria-label="Level"
          />
          <NumberInput.Stepper className={numberInputTheme.stepper}>
            <NumberInput.IncrementStepper
              className={numberInputTheme.incrementStepper}
            />
            <NumberInput.DecrementStepper
              className={numberInputTheme.decrementStepper}
            />
          </NumberInput.Stepper>
        </NumberInput.Root>
      </Card>

      <Card title="XYPad">
        <XYPad.Root
          className={xyPadTheme.root}
          value={xy}
          min={0}
          max={100}
          onChange={setXY}
        >
          <XYPad.Area className={xyPadTheme.area}>
            <XYPad.Thumb
              className={xyPadTheme.thumb}
              aria-label={['X position', 'Y position']}
            />
          </XYPad.Area>
        </XYPad.Root>
        <p>
          x: {xy[0]}, y: {xy[1]}
        </p>
      </Card>

      <Card title="Piano">
        <Piano.Root
          className={pianoTheme.root}
          keyProps={(_note, { keyType }) => ({
            className:
              keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
          })}
          noteRange={{ first: noteNumber('C4'), last: noteNumber('B4') }}
          onPlayNote={setNote}
          onStopNote={() => setNote(null)}
        />
        <p>note: {note === null ? '-' : noteName(note)}</p>
      </Card>

      <Card title="AnimationCanvas">
        <AnimationCanvas
          width={220}
          height={120}
          draw={(ctx, { width, height, count }) => {
            ctx.clearRect(0, 0, width, height)
            ctx.strokeStyle = '#29bbf0'
            ctx.beginPath()
            for (let i = 0; i < width; i++) {
              const y =
                height / 2 +
                (height / 4) * Math.sin((4 * Math.PI * (i + count * 2)) / width)
              if (i === 0) ctx.moveTo(i, y)
              else ctx.lineTo(i, y)
            }
            ctx.stroke()
          }}
        />
      </Card>
    </>
  )
}
