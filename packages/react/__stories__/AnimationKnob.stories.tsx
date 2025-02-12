import { CSSProperties, useState } from 'react'

import { AnimationKnob } from '../src/components/AnimationKnob'
import { normalizeValue } from '@tremolo-ui/functions'
import { Meta, StoryObj } from '@storybook/react'

import { inputEventOptionType, sizesOptionType } from './lib/typeUtils'

export default {
  title: 'React/Components/AnimationKnob',
  component: AnimationKnob,
  argTypes: {
    value: {
      control: false,
    },
    size: {
      table: {
        type: sizesOptionType
      }
    },
    width: {
      table: {
        type: sizesOptionType
      }
    },
    height: {
      table: {
        type: sizesOptionType
      }
    },
    wheel: {
      table: {
        type: inputEventOptionType
      }
    },
    keyboard: {
      table: {
        type: inputEventOptionType
      }
    },
    thumb: {
      control: 'color'
    },
  }
} satisfies Meta<typeof AnimationKnob>

type Story = StoryObj<typeof AnimationKnob>

export const Basic: Story = {
  args: {
    min: 0,
    max: 100,
    wheel: ['normalized', 0.05],
    keyboard: ['normalized', 0.05]
  },
  render: args => {
    const [value, setValue] = useState(10)

    return (
      <>
        <AnimationKnob
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
        />
        <p>value: {value}</p>
      </>
    )
  }
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
      <AnimationKnob
        width={'100%'}
        height={'100%'}
        value={value}
        min={0}
        max={100}
        onChange={(v) => setValue(v)}
        wheel={['normalized', 0.1]}
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
      <AnimationKnob
        value={value}
        startValue={0}
        defaultValue={0}
        min={-50}
        max={50}
        activeColor='#6ED8E6'
        inactiveColor='#161616'
        thumb='#161616'
        bg='#0000'
        lineWeight={4}
        onChange={(v) => setValue(v)}
        wheel={null}
      />
      <span>{fmt(value)}</span>
    </div>
  )
}

export const AdvancedImagiroKnob = () => {
  const [value, setValue] = useState(50)

  const borderStyles: CSSProperties[] = [
    {
      top: 0,
      left: 0,
      borderTopWidth: 4,
      borderLeftWidth: 4,
    },
    {
      top: 0,
      right: 0,
      borderTopWidth: 4,
      borderRightWidth: 4,
    },
    {
      bottom: 0,
      right: 0,
      borderBottomWidth: 4,
      borderRightWidth: 4,
    },
    {
      bottom: 0,
      left: 0,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
    },
  ]

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
        <AnimationKnob
          value={value}
          min={0}
          max={100}
          size={70}
          onChange={(v) => setValue(v)}
          wheel={['normalized', 0.1]}
          style={{ display: 'block' }}
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
          }}
        />
        {borderStyles.map((style, i) => {
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '30%',
                height: '30%',
                borderWidth: 0,
                borderColor: '#507C5E',
                borderStyle: 'solid',
                pointerEvents: 'none',
                ...style
              }}
            >
            </div>
          )
        })}
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

