import { useState } from 'react'

import { Knob } from '../src/components/Knob'
import { normalizeValue } from '@tremolo-ui/functions'

export default {
  title: 'React/Components/Knob',
  component: Knob,
  tags: ['autodocs'],
}

export const Basic = () => {
  const [value, setValue] = useState(10)

  return (
    <div>
      <Knob
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
        enableWheel={['normalized', 0.1]}
      />
      <p>value: {value}</p>
    </div>
  )
}

export const Size = () => {
  const [value, setValue] = useState(10)

  return (
    <div
      style={{
        backgroundColor: 'azure',
        width: '100%',
        height: 300,
        resize: 'both',
        overflow: 'hidden',
      }}
    >
      <Knob
        width={'100%'}
        height={'100%'}
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
        enableWheel={['normalized', 0.1]}
      />
      <p>value: {value}</p>
    </div>
  )
}

export const Options = () => {
  const [value, setValue] = useState(0)

  const fmt = (value: number) => {
    if (value < 0) return `${-value}L`
    else if (value > 0) return `${value}R`
    else return `C`
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: '#666',
        color: 'white',
      }}
    >
      <p>Pan</p>
      <Knob
        value={value}
        startValue={0}
        defaultValue={0}
        min={-50}
        max={50}
        options={{
          active: '#6ED8E6',
          inactive: '#161616',
          thumb: '#161616',
          bg: '#0000',
          lineWeight: 4,
        }}
        onChange={(v) => setValue(v)}
        enableWheel={['normalized', 0.1]}
      />
      <span>{fmt(value)}</span>
    </div>
  )
}

function drawEdge(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const len = w * 0.3
  const lines: [number, number][][] = [
    [
      [0, len],
      [0, -len],
      [len, 0],
    ],
    [
      [w - len, 0],
      [len, 0],
      [0, len],
    ],
    [
      [w, h - len],
      [0, len],
      [-len, 0],
    ],
    [
      [len, h],
      [-len, 0],
      [0, -len],
    ],
  ]
  lines.forEach((group) => {
    ctx.beginPath()
    let beforeX = 0, beforeY = 0
    group.forEach((line, i) => {
      if (i == 0) {
        beforeX = line[0]
        beforeY = line[1]
        ctx.moveTo(...line)
      } else {
        beforeX += line[0]
        beforeY += line[1]
        ctx.lineTo(beforeX, beforeY)
      }
    })
    ctx.stroke()
  })
}

export const AdvancedImagiroKnob = () => {
  const [value, setValue] = useState(50)

  return (
    <div
      style={{
        background: '#DFDBCD',
        padding: '1rem'
      }}
    >
      <p>Knob like Imagiro Autochroma</p>
      <div
        style={{
          position: 'relative',
          width: 'fit-content',
          height: 'fit-content',
        }}
      >
        <Knob
          value={value}
          min={0}
          max={100}
          size={70}
          onChange={(v) => setValue(v)}
          enableWheel={['normalized', 0.1]}
          draw={(ctx, width, height) => {
            const w = width.current
            const h = height.current
            ctx.clearRect(0, 0, w, h)
            const p = normalizeValue(value, 0, 100)
            const inv = normalizeValue(100 - value, 0, 100)
            ctx.beginPath()
            ctx.rect(0, h * inv, w, h * p)
            ctx.fillStyle = `rgba(106, 155, 121, ${p})`
            ctx.fill()

            ctx.strokeStyle = '#507C5E'
            ctx.lineWidth = 8
            drawEdge(ctx, w, h)
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        >{value}%</div>
      </div>
    </div>
  )
}

