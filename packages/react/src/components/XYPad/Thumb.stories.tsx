import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { XYPad } from '.'

export default {
  title: 'Components/XYPad/Thumb',
  component: XYPad.Thumb,
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof XYPad.Thumb>

type Story = StoryObj<typeof XYPad.Thumb>

/**
 * The thumb carries the pad's semantics: a range input per axis lives inside
 * it, which is where the focus, the values and the accessible names sit.
 * `aria-label` takes one name per axis, since there are two inputs.
 */
export const Basic: Story = {
  args: {
    color: '#4e76e5',
  },
  render: (args) => {
    const [value, setValue] = useState<[number, number]>([32, 56])

    return (
      <>
        <XYPad.Root value={value} min={0} max={100} onChange={setValue}>
          <XYPad.Area>
            <XYPad.Thumb aria-label={['X position', 'Y position']} {...args} />
          </XYPad.Area>
        </XYPad.Root>
        <p>
          x: {value[0]}, y: {value[1]}
        </p>
      </>
    )
  },
}

/**
 * The thumb is one element either way: children are drawn inside it rather
 * than in place of it.
 */
export const WithChildren: Story = {
  args: {
    children: '＋',
    style: { display: 'grid', placeItems: 'center', fontSize: 10 },
  },
  render: (args) => {
    const [value, setValue] = useState<[number, number]>([50, 50])

    return (
      <XYPad.Root value={value} min={0} max={100} onChange={setValue}>
        <XYPad.Area>
          <XYPad.Thumb aria-label={['X position', 'Y position']} {...args} />
        </XYPad.Area>
      </XYPad.Root>
    )
  },
}
