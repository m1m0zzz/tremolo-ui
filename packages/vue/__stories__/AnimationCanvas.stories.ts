import { AnimationCanvas, type DrawFunction } from '../src'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

/** A sine wave that scrolls with time. */
const draw: DrawFunction = (context, { width, height, elapsedTime }) => {
  context.clearRect(0, 0, width, height)
  context.beginPath()
  for (let x = 0; x <= width; x++) {
    const y = height / 2 + (Math.sin(x / 20 + elapsedTime / 200) * height) / 3
    if (x === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.strokeStyle = 'currentColor'
  context.stroke()
}

const meta = {
  title: 'Components/AnimationCanvas',
  component: AnimationCanvas,
  args: { draw, width: 300, height: 120 },
  argTypes: { draw: { control: false }, init: { control: false } },
} satisfies Meta<typeof AnimationCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {}
