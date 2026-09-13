import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { PointBaseType, PointsEditor } from '.'

import pointsEditorTheme from 'shared/css/PointsEditor.module.css'

export default {
  title: 'Components/PointsEditor/Background',
  component: PointsEditor.Background,
} satisfies Meta<typeof PointsEditor.Background>

type Story = StoryObj<typeof PointsEditor.Background>

/**
 * Whatever the points are placed over: a graph, a canvas, an image. It fills
 * the editor and sits under the container, so nothing in it takes a press
 * away from the points.
 */
export const Graph: Story = {
  render: (args) => {
    const [points, setPoints] = useState<Record<string, PointBaseType>>({
      a: { x: 0, y: 0.8 },
      b: { x: 0.5, y: 0.2 },
      c: { x: 1, y: 0.6 },
    })
    const line = Object.values(points)
      .sort((p, q) => p.x - q.x)
      .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'} ${x * 100} ${y * 100}`)
      .join(' ')

    return (
      <PointsEditor.Root className={pointsEditorTheme.root}>
        <PointsEditor.Background {...args}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%' }}
          >
            <path d={line} fill="none" stroke="#4e76e5" strokeWidth="1" />
          </svg>
        </PointsEditor.Background>
        <PointsEditor.Container>
          {Object.entries(points).map(([id, point]) => (
            <PointsEditor.Point
              className={pointsEditorTheme.point}
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
