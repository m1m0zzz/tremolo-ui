import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { XYPad } from '.'

import xyPadTheme from 'shared/css/XYPad.module.css'

export default {
  title: 'Components/XYPad/Area',
  component: XYPad.Area,
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof XYPad.Area>

type Story = StoryObj<typeof XYPad.Area>

/**
 * The area is the surface the thumb is placed on, and what the pointer is
 * normalized against: a press anywhere in it is a position on both axes. Its
 * props write the custom properties the theme reads — `color` is the surface
 * itself, so the theme's near-white stands unless Controls says otherwise.
 */
export const Basic: Story = {
  args: {
    width: 200,
    height: 140,
  },
  render: (args) => {
    const [value, setValue] = useState<[number, number]>([32, 56])

    return (
      <>
        <XYPad.Root
          className={xyPadTheme.root}
          value={value}
          min={0}
          max={100}
          onChange={setValue}
        >
          <XYPad.Area className={xyPadTheme.area} {...args}>
            <XYPad.Thumb
              className={xyPadTheme.thumb}
              aria-label={['X position', 'Y position']}
            />
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
 * Children other than the thumb are drawn inside the area, which is what a
 * grid or a curve behind the control is for.
 */
export const WithBackdrop: Story = {
  args: {
    width: 200,
    height: 140,
  },
  render: (args) => {
    const [value, setValue] = useState<[number, number]>([50, 50])

    return (
      <XYPad.Root
        className={xyPadTheme.root}
        value={value}
        min={0}
        max={100}
        onChange={setValue}
      >
        <XYPad.Area className={xyPadTheme.area} {...args}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <path
              d="M 50 0 V 100 M 0 50 H 100"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </svg>
          <XYPad.Thumb
            className={xyPadTheme.thumb}
            aria-label={['X position', 'Y position']}
          />
        </XYPad.Area>
      </XYPad.Root>
    )
  },
}
