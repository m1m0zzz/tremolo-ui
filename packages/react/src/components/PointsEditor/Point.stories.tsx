import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { PointBaseType, PointsEditor } from '.'

export default {
  title: 'Components/PointsEditor/Point',
  component: PointsEditor.Point,
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof PointsEditor.Point>

type Story = StoryObj<typeof PointsEditor.Point>

/**
 * A point is placed by its position in the container, so its value is
 * `{ x, y }` in 0..1 on each axis, with `y` growing downwards. `min` and `max`
 * are limits on where it may go, not a range it is mapped into.
 */
export const Basic: Story = {
  args: {
    size: 16,
    color: '#4e76e5',
  },
  render: (args) => {
    const [point, setPoint] = useState<PointBaseType>({ x: 0.5, y: 0.5 })

    return (
      <>
        <PointsEditor.Root>
          <PointsEditor.Background
            style={{ background: '#f2f4f5', borderRadius: 4 }}
          />
          <PointsEditor.Container>
            <PointsEditor.Point {...args} value={point} onChange={setPoint} />
          </PointsEditor.Container>
        </PointsEditor.Root>
        <p>
          x: {point.x}, y: {point.y}
        </p>
      </>
    )
  },
}

/**
 * `min` and `max` take one axis at a time, so a point can be pinned to a line
 * and still be moved along it.
 */
export const Limited: Story = {
  args: {
    size: 16,
    min: { y: 0.5 },
    max: { y: 0.5 },
  },
  render: (args) => {
    const [point, setPoint] = useState<PointBaseType>({ x: 0.25, y: 0.5 })

    return (
      <>
        <PointsEditor.Root>
          <PointsEditor.Background
            style={{ background: '#f2f4f5', borderRadius: 4 }}
          />
          <PointsEditor.Container>
            <PointsEditor.Point {...args} value={point} onChange={setPoint} />
          </PointsEditor.Container>
        </PointsEditor.Root>
        <p>only x moves: {point.x}</p>
      </>
    )
  },
}

/**
 * Children are drawn inside the point, on top of whatever the theme gives it.
 */
export const WithChildren: Story = {
  args: {
    size: 24,
    children: <span style={{ fontSize: 10 }}>1</span>,
    style: { display: 'grid', placeItems: 'center' },
  },
  render: (args) => {
    const [point, setPoint] = useState<PointBaseType>({ x: 0.5, y: 0.5 })

    return (
      <PointsEditor.Root>
        <PointsEditor.Background
          style={{ background: '#f2f4f5', borderRadius: 4 }}
        />
        <PointsEditor.Container>
          <PointsEditor.Point {...args} value={point} onChange={setPoint} />
        </PointsEditor.Container>
      </PointsEditor.Root>
    )
  },
}
