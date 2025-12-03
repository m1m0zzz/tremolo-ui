import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { skewWithCenterValue } from '@tremolo-ui/functions'

import { Knob } from '../../src/components/Knob'
import { inputEventOptionType } from '../lib/typeUtils'

export default {
  title: 'Components/Knob/Root',
  component: Knob.Root,
  argTypes: {
    value: {
      control: false,
    },
    wheel: {
      table: {
        type: inputEventOptionType,
      },
    },
    keyboard: {
      table: {
        type: inputEventOptionType,
      },
    },
    children: {
      control: false,
    },
  },
} satisfies Meta<typeof Knob.Root>

type Story = StoryObj<typeof Knob.Root>

export const Basic: Story = {
  args: {
    min: 0,
    max: 100,
    size: 50,
    wheel: ['normalized', 0.05],
    keyboard: ['normalized', 0.05],
  },
  render: (args) => {
    const [value, setValue] = useState(10)

    return (
      <>
        <Knob.Root {...args} value={value} onChange={(v) => setValue(v)} />
        <p>value: {value}</p>
      </>
    )
  },
}

export const Logarithmic: Story = {
  args: {
    min: 20,
    max: 22000,
    size: 50,
    wheel: ['normalized', 0.05],
    keyboard: ['normalized', 0.05],
  },
  render: (args) => {
    const [value, setValue] = useState(10)
    const [value2, setValue2] = useState(10)

    const container: React.CSSProperties = {
      display: 'flex',
      width: 100,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }

    const fmt = (value: number) => {
      return 1000 <= value ? `${(value / 1000).toFixed(1)}kHz` : `${value}Hz`
    }

    return (
      <div>
        <p>
          <pre>
            <code>
              skew = skewWithCenterValue(Math.sqrt(min, max), min, max)
            </code>
          </pre>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
          <div style={container}>
            <p>liner</p>
            <Knob.Root {...args} value={value} onChange={(v) => setValue(v)} />
            <p>freq. {fmt(value)}</p>
          </div>
          <div style={container}>
            <p>log</p>
            <Knob.Root
              {...args}
              value={value2}
              skew={skewWithCenterValue(
                Math.sqrt(args.min * args.max),
                args.min,
                args.max,
              )}
              step={0.1}
              onChange={(v) => setValue2(v)}
            />
            <p>freq. {fmt(value2)}</p>
          </div>
        </div>
      </div>
    )
  },
}
