import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Knob } from '../../src/components/Knob'
import { NumberInput } from '../../src/components/NumberInput'

export default {
  title: 'Components/NumberInput/Root',
  component: NumberInput.Root,
  argTypes: {
    value: {
      control: false,
    },
    children: {
      control: false,
    },
  },
} satisfies Meta<typeof NumberInput.Root>

type Story = StoryObj<typeof NumberInput.Root>

const hzUnits: [string, number][] = [
  ['Hz', 1],
  ['kHz', 1000],
]

export const Basic: Story = {
  render: (args) => {
    const [value, setValue] = useState(32)

    return (
      <NumberInput.Root {...args} value={value} onChange={(v) => setValue(v)}>
        <NumberInput.InputField />
      </NumberInput.Root>
    )
  },
}

export const UnitsAndDigit: Story = {
  args: {
    units: hzUnits,
    digit: 4,
  },
  render: (args) => {
    const [value, setValue] = useState(4321)

    return (
      <NumberInput.Root {...args} value={value} onChange={(v) => setValue(v)}>
        <NumberInput.InputField />
        <NumberInput.Stepper>
          <NumberInput.IncrementStepper />
          <NumberInput.DecrementStepper />
        </NumberInput.Stepper>
      </NumberInput.Root>
    )
  },
}

/**
 * `format` / `parse` take over from `units` / `digit` entirely, so the text can
 * be anything the value can be read back out of.
 */
export const CustomFormat: Story = {
  args: {
    min: 0,
    max: 1,
    step: 0.01,
  },
  render: (args) => {
    const [value, setValue] = useState(0.5)

    return (
      <div>
        <NumberInput.Root
          {...args}
          value={value}
          format={(v) => `${Math.round(v * 100)}%`}
          parse={(t) => (parseFloat(t) || 0) / 100}
          onChange={(v) => setValue(v)}
        >
          <NumberInput.InputField />
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
        <p>value: {value}</p>
      </div>
    )
  },
}

export const WithAnotherComponents: Story = {
  args: {
    min: 0,
    max: 100,
    units: hzUnits,
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
          >
            <Knob.SVGRoot>
              <Knob.InactiveLine />
              <Knob.ActiveLine />
              <Knob.Thumb />
            </Knob.SVGRoot>
          </Knob.Root>
          {value}
        </div>
        <NumberInput.Root {...args} value={value} onChange={(v) => setValue(v)}>
          <NumberInput.InputField />
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
      </div>
    )
  },
}

/**
 * Typing is never clamped, so a value can be entered digit by digit. With
 * `clampValue` on, the entry is brought back into range once it is committed.
 */
export const ClampValue = () => {
  const [clamped, setClamped] = useState(50)
  const [unclamped, setUnclamped] = useState(50)

  return (
    <div>
      <section style={{ marginBottom: '2rem' }}>
        <p>clampValue (default), min=0 max=100</p>
        <NumberInput.Root
          value={clamped}
          min={0}
          max={100}
          onChange={setClamped}
        >
          <NumberInput.InputField />
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
        <p>value: {clamped}</p>
      </section>
      <section>
        <p>clampValue={'{false}'}, min=0 max=100 — out of range is kept</p>
        <NumberInput.Root
          value={unclamped}
          min={0}
          max={100}
          clampValue={false}
          onChange={setUnclamped}
        >
          <NumberInput.InputField />
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
        <p>value: {unclamped}</p>
      </section>
    </div>
  )
}

export const SelectOnFocus = () => {
  const [value1, setValue1] = useState(32)
  const [value2, setValue2] = useState(32)
  const [value3, setValue3] = useState(32)

  const data: {
    selectOnFocus: 'none' | 'all' | 'number'
    v: number
    setter: (v: number) => void
  }[] = [
    { selectOnFocus: 'none', v: value1, setter: setValue1 },
    { selectOnFocus: 'all', v: value2, setter: setValue2 },
    { selectOnFocus: 'number', v: value3, setter: setValue3 },
  ]

  return (
    <div>
      {data.map(({ selectOnFocus, v, setter }) => (
        <section key={selectOnFocus} style={{ marginBottom: '2rem' }}>
          <p>selectOnFocus=&apos;{selectOnFocus}&apos;</p>
          <NumberInput.Root value={v} units={hzUnits} onChange={setter}>
            <NumberInput.InputField selectOnFocus={selectOnFocus} />
          </NumberInput.Root>
        </section>
      ))}
    </div>
  )
}
