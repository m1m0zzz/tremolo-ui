import { useState } from 'react'

import { NumberInput } from '../src/components/NumberInput'
import { Meta, StoryObj } from '@storybook/react'

export default {
  title: 'React/Components/NumberInput',
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
  args: {
    typeNumber: true,
  },
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
    digit: 1,
    // _hover: { borderColor: 'red' }
  },
  render: (args) => {
    const [value, setValue] = useState(4321)

    return <NumberInput {...args} value={value} onChange={(v) => setValue(v)} />
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
