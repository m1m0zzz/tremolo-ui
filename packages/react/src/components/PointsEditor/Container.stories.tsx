import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { PointBaseType, PointsEditor } from '.'

export default {
  title: 'Components/PointsEditor/Container',
  component: PointsEditor.Container,
} satisfies Meta<typeof PointsEditor.Container>

type Story = StoryObj<typeof PointsEditor.Container>

/**
 * The container is the space a point's 0..1 is measured against, and the one
 * listener the wheel and a selection drag are attached to. Inset it and the
 * points follow: `x: 0` is the container's left edge, not the editor's.
 */
export const Inset: Story = {
  args: {
    style: { inset: '20px' },
  },
  render: (args) => {
    const [points, setPoints] = useState<Record<string, PointBaseType>>({
      a: { x: 0, y: 0 },
      b: { x: 1, y: 1 },
    })

    return (
      <PointsEditor.Root>
        <PointsEditor.Background
          style={{ background: '#f2f4f5', borderRadius: 4 }}
        />
        <PointsEditor.Container {...args}>
          {Object.entries(points).map(([id, point]) => (
            <PointsEditor.Point
              key={id}
              id={id}
              value={point}
              onChange={(v) => setPoints((all) => ({ ...all, [id]: v }))}
            />
          ))}
        </PointsEditor.Container>
      </PointsEditor.Root>
    )
  },
}
