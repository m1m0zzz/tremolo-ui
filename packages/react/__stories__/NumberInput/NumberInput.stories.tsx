import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Knob } from '../../src/components/Knob'
import { NumberInput, NumberInputProps } from '../../src/components/NumberInput'
import { inputEventOptionType } from '../lib/typeUtils'

export default {
  title: 'Components/NumberInput/Root',
  component: NumberInput.Root,
  argTypes: {
    value: {
      control: false,
      table: {
        type: {
          summary: 'number | string',
        },
      },
    },
    units: {
      table: {
        type: {
          summary: 'string | Units',
          detail: 'string | [string, number][]',
        },
      },
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
} satisfies Meta<typeof NumberInput.Root>

type Story = StoryObj<typeof NumberInput.Root>

export const Basic: Story = {
  render: (args) => {
    const [value, setValue] = useState(32)

    return (
      <NumberInput.Root {...args} value={value} onChange={(v) => setValue(v)} />
    )
  },
}

export const UnitsAndDigit: Story = {
  args: {
    units: [
      ['Hz', 1],
      ['kHz', 1000],
    ],
    digit: 4,
  },
  render: (args) => {
    const [value, setValue] = useState(4321)

    return (
      <NumberInput.Root {...args} value={value} onChange={(v) => setValue(v)}>
        <NumberInput.Stepper>
          <NumberInput.IncrementStepper />
          <NumberInput.DecrementStepper />
        </NumberInput.Stepper>
      </NumberInput.Root>
    )
  },
}

export const WithAnotherComponents: Story = {
  args: {
    min: 0,
    max: 100,
    units: [
      ['Hz', 1],
      ['kHz', 1000],
    ],
  },
  render: (args) => {
    const [value, setValue] = useState(0)

    return (
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Knob.Root
            value={value}
            min={args.min ?? Number.MIN_SAFE_INTEGER}
            max={args.max ?? Number.MAX_SAFE_INTEGER}
            onChange={(v) => setValue(v)}
          />
          {value}
        </div>
        <NumberInput.Root {...args} value={value} onBlur={(v) => setValue(v)}>
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
      </div>
    )
  },
}

export const Variant = () => {
  const [value1, setValue1] = useState(0)
  const [value2, setValue2] = useState(0)
  const [value3, setValue3] = useState(0)
  const [value4, setValue4] = useState(0)

  const data: {
    variant: NumberInputProps['variant']
    v: number
    setter: React.Dispatch<React.SetStateAction<number>>
  }[] = [
    { variant: 'outline', v: value1, setter: setValue1 },
    { variant: 'filled', v: value2, setter: setValue2 },
    { variant: 'flushed', v: value3, setter: setValue3 },
    { variant: 'unstyled', v: value4, setter: setValue4 },
  ]

  return (
    <div>
      {data.map(({ variant, v, setter }) => {
        return (
          <section key={variant} style={{ marginBottom: '2rem' }}>
            <p>{variant}</p>
            <div>
              <NumberInput.Root
                value={v}
                units={[
                  ['Hz', 1],
                  ['kHz', 1000],
                ]}
                variant={variant}
                onChange={(v) => setter(v)}
              />
            </div>
          </section>
        )
      })}
    </div>
  )
}

export const SelectWithFocus = () => {
  const [value1, setValue1] = useState(32)
  const [value2, setValue2] = useState(32)
  const [value3, setValue3] = useState(32)

  return (
    <div>
      <section style={{ marginBottom: '2rem' }}>
        <p>
          selectWithFocus={'{'}undefined{'}'} (default)
        </p>
        <NumberInput.Root
          value={value1}
          units={[
            ['Hz', 1],
            ['kHz', 1000],
          ]}
          onChange={(v) => setValue1(v)}
        />
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <p>selectWithFocus='all'</p>
        <NumberInput.Root
          value={value2}
          units={[
            ['Hz', 1],
            ['kHz', 1000],
          ]}
          selectWithFocus="all"
          onChange={(v) => setValue2(v)}
        />
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <p>selectWithFocus='number'</p>
        <NumberInput.Root
          value={value3}
          units={[
            ['Hz', 1],
            ['kHz', 1000],
          ]}
          selectWithFocus="number"
          onChange={(v) => setValue3(v)}
        />
      </section>
    </div>
  )
}

export const WithStepper: Story = {
  args: {
    min: 0,
    max: 100,
    units: [
      ['Hz', 1],
      ['kHz', 1000],
    ],
  },
  render: (args) => {
    const [value, setValue] = useState(32)

    return (
      <div>
        <NumberInput.Root {...args} value={value} onChange={(v) => setValue(v)}>
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
      </div>
    )
  },
}
