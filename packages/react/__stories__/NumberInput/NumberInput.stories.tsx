import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Knob } from '../../src/components/Knob'
import {
  DecrementStepper,
  IncrementStepper,
  NumberInput,
  Stepper,
} from '../../src/components/NumberInput'

export default {
  title: 'Components/NumberInput/NumberInput',
  component: NumberInput,
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
  },
} satisfies Meta<typeof NumberInput>

type Story = StoryObj<typeof NumberInput>

export const Basic: Story = {
  render: (args) => {
    const [value, setValue] = useState(32)

    return <NumberInput {...args} value={value} onChange={(v) => setValue(v)} />
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

    return <NumberInput {...args} value={value} onChange={(v) => setValue(v)} />
  },
}

export const WithAnotherComponents: Story = {
  args: {
    units: [
      ['Hz', 1],
      ['kHz', 1000],
    ],
  },
  render: (args) => {
    const [value, setValue] = useState(0)
    // console.log('render: ', value)

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
          <Knob value={value} min={0} max={100} onChange={(v) => setValue(v)} />
          {value}
        </div>
        <NumberInput {...args} value={value} onChange={(v) => setValue(v)}>
          <Stepper>
            <IncrementStepper />
            <DecrementStepper />
          </Stepper>
        </NumberInput>
      </div>
    )
  },
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
        <NumberInput
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
        <NumberInput
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
        <NumberInput
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
