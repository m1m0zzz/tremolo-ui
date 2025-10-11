import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  AnimationCanvas,
  AnimationCanvasProps,
} from '../src/components/AnimationCanvas'
import { Slider } from '../src/components/Slider'

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
          draw={(ctx, { width, height, count }) => {
            ctx.clearRect(0, 0, width, height)
            ctx.fillText(`frame: ${count}`, 0, 16)
            // draw sine wave
            const halfH = height / 2
            ctx.beginPath()
            for (let i = 0; i < width; i++) {
              const y =
                halfH +
                halfH * 0.5 * Math.sin((4 * Math.PI * (i + count * 2)) / width)
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
        relativeSize
        draw={(ctx, { width, height, count, deltaTime, fps, elapsedTime }) => {
          ctx.clearRect(0, 0, width, height)

          // frame
          const pad = 30
          const interval = 30
          ctx.strokeStyle = 'black'
          for (let x = 0; x < width + height; x += interval) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(0, x)
            ctx.stroke()
          }
          ctx.rect(pad, pad, width - pad * 2, height - pad * 2)
          ctx.fillStyle = 'white'
          ctx.fill()

          // text
          ctx.fillStyle = 'black'
          ctx.font = '16px sans-serif'
          fillTextCenter(
            ctx,
            `{ w: ${width}, h: ${height} }`,
            width / 2,
            height / 2 - 20,
          )
          fillTextCenter(
            ctx,
            `count: ${count}, time: ${(elapsedTime / 1000).toFixed(2)} s`,
            width / 2,
            height / 2,
          )
          fillTextCenter(
            ctx,
            `fps: ${fps.toFixed()}`,
            width / 2,
            height / 2 + 20,
          )
          fillTextCenter(
            ctx,
            `delta: ${deltaTime.toFixed(2)} ms`,
            width / 2,
            height / 2 + 40,
          )
        }}
      />
    </div>
  )
}

export const SavingContext = () => {
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
        relativeSize
        draw={(ctx, { width, height, elapsedTime, count }) => {
          ctx.save()
          ctx.clearRect(0, 0, width, height)

          ctx.fillStyle = 'gray'
          ctx.fillRect(40, 40, 30, 30)

          ctx.scale(2, 2)
          ctx.fillStyle = 'red'
          ctx.fillRect(40, 40, 30, 30)

          ctx.restore()

          // text
          ctx.fillStyle = 'black'
          ctx.font = '16px sans-serif'
          ctx.fillText(
            `frame: ${count}, ${(elapsedTime / 1000).toFixed(2)} s`,
            0,
            16,
          )
        }}
      />
    </div>
  )
}

export const NoAnimate = () => {
  const [value, setValue] = useState(0)

  return (
    <section>
      <p>
        Sample that dynamically changes the drawing without animation, using
        re-rendering
      </p>
      <p>You can see that it redraws when you move the slider.</p>
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
          animate={false}
          relativeSize
          reduceFlickering={false}
          draw={(
            ctx,
            { width, height, count, deltaTime, fps, elapsedTime },
          ) => {
            const color = `hsl(${value} 100% 50%)`
            ctx.clearRect(0, 0, width, height)
            // frame
            const pad = 30
            const interval = 30
            ctx.strokeStyle = color
            for (let x = 0; x < width + height; x += interval) {
              ctx.beginPath()
              ctx.moveTo(x, 0)
              ctx.lineTo(0, x)
              ctx.stroke()
            }
            ctx.rect(pad, pad, width - pad * 2, height - pad * 2)
            ctx.fillStyle = 'white'
            ctx.fill()
            // text
            ctx.fillStyle = color
            ctx.font = '16px sans-serif'
            fillTextCenter(
              ctx,
              `{ w: ${width}, h: ${height} }`,
              width / 2,
              height / 2 - 20,
            )
            fillTextCenter(
              ctx,
              `count: ${count}, time: ${(elapsedTime / 1000).toFixed(2)} s`,
              width / 2,
              height / 2,
            )
            fillTextCenter(
              ctx,
              `fps: ${fps.toFixed()}`,
              width / 2,
              height / 2 + 20,
            )
            fillTextCenter(
              ctx,
              `delta: ${deltaTime.toFixed(2)} ms`,
              width / 2,
              height / 2 + 40,
            )
          }}
        />
      </div>
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        <span>hue</span>
        <Slider value={value} min={0} max={360} onChange={setValue} />
        <span>{value} deg</span>
      </div>
    </section>
  )
}
