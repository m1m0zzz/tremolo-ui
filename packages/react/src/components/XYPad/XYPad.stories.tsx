import { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentProps, useState } from 'react'

import { XYPad } from '.'

import xyPadTheme from 'shared/css/XYPad.module.css'

export default {
  title: 'Components/XYPad/Root',
  component: XYPad.Root,
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
 * An arg that is not a prop: whether `Area` is given a `Thumb`. Storybook
 * shows anything in `args`, so a story can put its own switches in Controls as
 * long as `render` takes them out before spreading the rest onto the
 * component.
 */
type Parts = {
  thumb: boolean
}

type Args = ComponentProps<typeof XYPad.Root> & Parts

type Story = StoryObj<Args>

/** Declared on the story, so it only shows where it means something. */
const partsArgTypes = {
  thumb: { control: 'boolean', table: { category: 'Parts' } },
} as const

export const Basic: Story = {
  argTypes: partsArgTypes,
  args: {
    min: 0,
    max: 100,
    thumb: true,
  },
  render: ({ thumb, ...args }) => {
    const [valueX, setValueX] = useState(32)
    const [valueY, setValueY] = useState(56)

    return (
      <>
        <XYPad.Root
          className={xyPadTheme.root}
          {...args}
          value={[valueX, valueY]}
          onChange={([x, y]) => {
            setValueX(x)
            setValueY(y)
          }}
          onDragStart={([x, y]) => console.log(`drag start: x=${x}, y=${y}`)}
          onDragEnd={([x, y]) => console.log(`drag end: x=${x}, y=${y}`)}
        >
          <XYPad.Area className={xyPadTheme.area}>
            {thumb && <XYPad.Thumb className={xyPadTheme.thumb} />}
          </XYPad.Area>
        </XYPad.Root>
        <p>x: {valueX}</p>
        <p>y: {valueY}</p>
      </>
    )
  },
}
