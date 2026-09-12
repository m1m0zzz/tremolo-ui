import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { PointBaseType, PointsEditor } from '.'

export default {
  title: 'Components/PointsEditor/SelectionBox',
  component: PointsEditor.SelectionBox,
} satisfies Meta<typeof PointsEditor.SelectionBox>

type Story = StoryObj<typeof PointsEditor.SelectionBox>

function Subject({
  children,
  ...props
}: React.ComponentProps<typeof PointsEditor.SelectionBox>) {
  const [points, setPoints] = useState<Record<string, PointBaseType>>({
    a: { x: 0.2, y: 0.3 },
    b: { x: 0.5, y: 0.6 },
    c: { x: 0.8, y: 0.4 },
  })

  return (
    <>
      <p>Drag over the points to select them, then move them with the keys.</p>
      <PointsEditor.Root selectable>
        <PointsEditor.Background
          style={{ background: '#f2f4f5', borderRadius: 4 }}
        />
        <PointsEditor.Container>
          {Object.entries(points).map(([id, point]) => (
            <PointsEditor.Point
              key={id}
              id={id}
              value={point}
              onChange={(v) => setPoints((all) => ({ ...all, [id]: v }))}
            />
          ))}
          <PointsEditor.SelectionBox {...props}>
            {children}
          </PointsEditor.SelectionBox>
        </PointsEditor.Container>
      </PointsEditor.Root>
    </>
  )
}

/**
 * The box a drag on empty space draws; what it covers is selected. It is only
 * rendered while that drag is running, and leaving it out of the container
 * leaves the editor without one — the selection still works, it just cannot
 * be seen.
 */
export const Basic: Story = {
  render: (args) => <Subject {...args} />,
}

/**
 * Everything a div takes reaches it. Only the position and the size are the
 * component's, since those are the drag rather than a style.
 */
export const Styled: Story = {
  args: {
    style: {
      border: '2px dashed #e0699f',
      backgroundColor: 'transparent',
    },
  },
  render: (args) => <Subject {...args} />,
}
