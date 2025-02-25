import { Meta, StoryObj } from '@storybook/react'

import {
  AnimationCanvas,
  AnimationCanvasProps,
} from '../src/components/AnimationCanvas'

export default {
  title: 'Components/AnimationCanvas',
  component: AnimationCanvas,
  argTypes: {
    width: {
      if: { arg: 'relativeSize', truthy: false },
    },
    height: {
      if: { arg: 'relativeSize', truthy: false },
    },
  },
} satisfies Meta<AnimationCanvasProps>

type Story = StoryObj<AnimationCanvasProps>

export const Basic: Story = {
  args: {
    width: 300,
    height: 200,
  },
  render: (args) => {
    return (
      <div
        style={{
          maxHeight: '100vh',
        }}
      >
        <AnimationCanvas
          {...args}
          init={(ctx) => {
            ctx.font = '16px sans-serif'
            ctx.strokeStyle = 'blue'
          }}
          draw={(ctx, w, h, count) => {
            ctx.clearRect(0, 0, w.current, h.current)
            ctx.fillText(`frame: ${count}`, 0, 16)
            // draw sine wave
            const halfH = h.current / 2
            ctx.beginPath()
            for (let i = 0; i < w.current; i++) {
              const y =
                halfH +
                halfH *
                  0.5 *
                  Math.sin((4 * Math.PI * (i + count * 2)) / w.current)
              if (i == 0) ctx.moveTo(i, y)
              else ctx.lineTo(i, y)
            }
            ctx.stroke()
          }}
        />
      </div>
    )
  },
}

const fillTextCenter = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) => {
  const w = ctx.measureText(text).width
  ctx.fillText(text, x - w / 2, y)
}

export const RelativeSize = () => {
  return (
    <div
      style={{
        width: 300,
        height: 200,
        minWidth: 150,
        minHeight: 150,
        resize: 'both',
        overflow: 'hidden',
        border: '1px solid black',
      }}
    >
      <AnimationCanvas
        relativeSize={true}
        onContextMenu={(e) => e.preventDefault()}
        draw={(ctx, w, h, count) => {
          ctx.clearRect(0, 0, w.current, h.current)

          // frame
          const pad = 30
          const interval = 30
          ctx.strokeStyle = 'black'
          for (let x = 0; x < w.current + h.current; x += interval) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(0, x)
            ctx.stroke()
          }
          ctx.rect(pad, pad, w.current - pad * 2, h.current - pad * 2)
          ctx.fillStyle = 'white'
          ctx.fill()

          // text
          ctx.fillStyle = 'black'
          ctx.font = '16px sans-serif'
          fillTextCenter(ctx, `w: ${w.current}`, w.current / 2, h.current / 2)
          fillTextCenter(
            ctx,
            `h: ${h.current}`,
            w.current / 2,
            h.current / 2 + 20,
          )
          fillTextCenter(
            ctx,
            `count: ${count}`,
            w.current / 2,
            h.current / 2 + 40,
          )
        }}
      />
    </div>
  )
}
