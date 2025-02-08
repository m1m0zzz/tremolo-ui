import { memo, useState } from 'react'

import {
  XYPad,
  XYPadThumb,
  XYPadArea,
} from '../src/components/XYPad'
import { integerPart, skewWithCenterValue, toFixed } from '@tremolo-ui/functions'
import { AnimationCanvas } from '../src/components/AnimationCanvas'
import { Meta, StoryObj } from '@storybook/react'
import { InputEventOptionString } from './lib/typeUtils'

const valueOptionsDetail = `{
  value: number
  min: number
  max: number
  step?: number
  skew?: number
  reverse?: boolean
  wheel?: ${InputEventOptionString} | null
  keyboard?: ${InputEventOptionString} | null
}`

export default {
  title: 'React/Components/XYPad',
  component: XYPad,
  argTypes: {
    x: {
      description: 'NOTE: The `value` of controls is not valid because it is wrapped in useState.',
      table: {
        type: {
          summary: 'ValueOptions',
          detail: valueOptionsDetail
        }
      }
    },
    y: {
      description: 'NOTE: The `value` of controls is not valid because it is wrapped in useState.',
      table: {
        type: {
          summary: 'ValueOptions',
          detail: valueOptionsDetail
        }
      }
    },
    children: {
      control: false
    }
  }
} satisfies Meta<typeof XYPad>

type Story = StoryObj<typeof XYPad>

export const Basic: Story = {
  args: {
    x: {
      value: 0,
      min: 0,
      max: 100
    },
    y: {
      value: 0,
      min: 0,
      max: 100
    },
  },
  render: args => {
    const [valueX, setValueX] = useState(32)
    const [valueY, setValueY] = useState(56)

    return (
      <>
        <XYPad
          {...args}
          x={{
            ...args.x,
            value: valueX,
          }}
          y={{
            ...args.y,
            value: valueY,
          }}
          onChange={(x, y) => {
            setValueX(x)
            setValueY(y)
          }} />
        <p>x: {valueX}</p>
        <p>y: {valueY}</p>
      </>
    )
  }
}

const rand = (max: number, min = 0) => {
  return min + Math.random() * (max - min)
}

const dots: {
  x: number
  y: number
  dx: number
  dy: number
  size: number
  opacity: number
}[] = []

const createDot = (x: number, y: number, size: number) => {
  dots.push({
    x: x,
    y: y,
    dx: rand(0.1, -0.1),
    dy: rand(0.1, -0.1),
    size: size,
    opacity: 0.4
  })
}

const processDots = () => {
  dots.forEach((dot) => {
    dot.x += dot.dx
    dot.y += dot.dy
    dot.opacity -= 0.005
  })
  dots.filter((dot) => dot.opacity > 0)
}

const ThumbAnimation = memo(() => {
  return (
    <AnimationCanvas
      width={40}
      height={40}
      draw={(ctx, _w, _h, count) => {
        const w = _w.current
        const h = _h.current
        // bg
        ctx.clearRect(0, 0, w, h)
        ctx.fill()

        if (count % 20 == 0) {
          const size = rand(15, 8)
          const padding = 25
          createDot(rand(w - padding, padding), rand(w - padding, padding), size)
        }

        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, dot.size, 0, 2 * Math.PI)
          ctx.fill()
        }
        processDots()
      }}
      style={{
        display: 'block'
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
})

export const AdvancedFilterPad = () => {
  const [frequency, setFrequency] = useState(2000)
  const [q, setQ] = useState(0.79)

  const fmt = (freq: number) => {
    if (freq < 100) {
      return `${freq}Hz`
    } else if (freq < 1000) {
      return `${toFixed(freq)}Hz`
    } else {
      return `${toFixed(freq / 1000, 3 - (integerPart(freq / 1000)?.length ?? 0))}kHz`
    }
  }

  return (
    <div
      style={{
        fontFamily: `"Mohave", serif`,
        fontOpticalSizing: 'auto',
        fontSize: '1.2rem',
        fontWeight: 400,
        width: 'fit-content',
        color: '#222',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          borderRadius: 8,
          background: 'rgb(207, 182, 240)',
          border: 'solid rgb(178, 150, 215) 2px'
        }}
      >
        <XYPad
          x={{
            value: frequency,
            min: 20,
            max: 20_000,
            skew: skewWithCenterValue(2000, 20, 20_000),
            step: 0.1,
            wheel: ['normalized', 0.05],
            keyboard: ['normalized', 0.05],
          }}
          y={{
            value: q,
            min: 0.01,
            max: 2,
            step: 0.01,
            reverse: true,
            wheel: ['raw', 0.1],
            keyboard: ['raw', 0.1],
          }}
          onChange={(x, y) => {
            setFrequency(x)
            setQ(y)
          }}
        >
          <XYPadArea
            width={200}
            bg='transparent'
          />
          <XYPadThumb size={40}>
            <ThumbAnimation />
          </XYPadThumb>
        </XYPad>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          marginTop: 6,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 4px',
          }}
        >
          <div>freq</div>
          <div>{fmt(frequency)}</div>
        </div>
        <div
          style={{
            width: 1,
            height: '80%',
            background: '#666',
          }}
        ></div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 4px',
          }}
        >
          <div>Q</div>
          <div>{q}</div>
        </div>
      </div>
    </div>
  )
}
