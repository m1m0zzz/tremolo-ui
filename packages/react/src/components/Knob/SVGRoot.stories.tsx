import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Knob } from '.'

export default {
  title: 'Components/Knob/SVGRoot',
  component: Knob.SVGRoot,
} satisfies Meta<typeof Knob.SVGRoot>

/**
 * Typed against `Root`, not `SVGRoot`. `SVGRoot` takes nothing but the parts
 * that go inside it; the size the drawing is laid out in comes from `Root`,
 * and this is what puts it in Controls.
 */
type Story = StoryObj<typeof Knob.Root>

/**
 * `SVGRoot` is the `<svg>` the knob is drawn in. The parts inside it are
 * painted in the order they are written, so the two knobs below differ only in
 * where `Thumb` sits in that order: it covers the arcs on the left, and the
 * arcs are drawn over it on the right. The lines are thick here so that the
 * overlap is there to see — at the default width the parts barely meet.
 */
export const PaintOrder: Story = {
  args: {
    size: 90,
  },
  render: (args) => {
    const [value, setValue] = useState(70)

    return (
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <Knob.Root
          {...args}
          aria-label="Thumb on top"
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
        >
          <Knob.SVGRoot>
            <Knob.InactiveLine strokeWidth={16} stroke="#dfe3ea" />
            <Knob.ActiveLine strokeWidth={16} stroke="#4e76e5" />
            <Knob.Thumb thumbSize={88} thumb="#e0699f" thumbLine="#fff" />
          </Knob.SVGRoot>
        </Knob.Root>
        <Knob.Root
          {...args}
          aria-label="Thumb underneath"
          value={value}
          min={0}
          max={100}
          onChange={(v) => setValue(v)}
        >
          <Knob.SVGRoot>
            <Knob.Thumb thumbSize={88} thumb="#e0699f" thumbLine="#fff" />
            <Knob.InactiveLine strokeWidth={16} stroke="#dfe3ea" />
            <Knob.ActiveLine strokeWidth={16} stroke="#4e76e5" />
          </Knob.SVGRoot>
        </Knob.Root>
        <p>value: {value}</p>
      </div>
    )
  },
}
