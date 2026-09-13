import { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentProps, useState } from 'react'

import { unitFormat } from '@tremolo-ui/functions'

import { Knob } from '../Knob'

import { NumberInput } from '.'

import knobTheme from 'shared/css/Knob.module.css'

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
} satisfies Meta<Args>

/**
 * An arg that is not a prop: whether the `Stepper` is mounted. Storybook shows
 * anything in `args`, so a story can put its own switches in Controls as long
 * as `render` takes them out before spreading the rest onto the component.
 */
type Parts = {
  stepper: boolean
}

type Args = ComponentProps<typeof NumberInput.Root> & Parts

type Story = StoryObj<Args>

/** Declared on the story, so it only shows where it means something. */
const partsArgTypes = {
  stepper: {
    control: 'boolean',
    table: { category: 'Parts' },
  },
} as const

/** `format` and `parse` come as a pair, so they spread in together. */
const hz = unitFormat('Hz')

export const Basic: Story = {
  argTypes: partsArgTypes,
  args: {
    stepper: false,
  },
  render: ({ stepper, ...args }) => {
    const [value, setValue] = useState(32)

    return (
      <NumberInput.Root {...args} value={value} onChange={(v) => setValue(v)}>
        <NumberInput.InputField />
        {stepper && (
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        )}
      </NumberInput.Root>
    )
  },
}

export const WithUnit: Story = {
  args: {
    ...unitFormat('Hz', { digits: 4 }),
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
    ...hz,
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
            className={knobTheme.root}
            value={value}
            min={args.min ?? 0}
            max={args.max ?? 100}
            onChange={(v) => setValue(v)}
          >
            <Knob.SVGRoot>
              <Knob.InactiveLine className={knobTheme.inactiveLine} />
              <Knob.ActiveLine className={knobTheme.activeLine} />
              <Knob.Thumb
                className={knobTheme.thumb}
                classes={{ thumbLine: knobTheme.thumbLine }}
              />
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
 * Typing is never clamped, so a value can be entered digit by digit. It is
 * `clampValue` that says what happens once the entry is committed: on, it is
 * brought back into the range; off — as it starts here — it is kept as typed.
 */
export const ClampValue: Story = {
  args: {
    min: 0,
    max: 100,
    clampValue: false,
  },
  render: (args) => {
    const [value, setValue] = useState(50)

    return (
      <div>
        <NumberInput.Root {...args} value={value} onChange={setValue}>
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
