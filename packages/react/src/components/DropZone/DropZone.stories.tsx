import { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentProps, useState } from 'react'

import { DropZone } from '.'

import dropZoneTheme from 'shared/css/DropZone.module.css'

export default {
  title: 'Components/DropZone/Root',
  component: DropZone.Root,
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof DropZone.Root>

type Story = StoryObj<ComponentProps<typeof DropZone.Root>>

/**
 * Drag an audio file onto the area. `[data-dragover]` and `[data-invalid]` are
 * on the element while a drag is in the air, which is what the dashed border
 * changes colour from — try a file that is not audio to see the refusal.
 */
export const Basic: Story = {
  args: {
    accept: 'audio/*',
    multiple: true,
    disabled: false,
  },
  render: (args) => {
    const [files, setFiles] = useState<File[]>([])
    const [rejected, setRejected] = useState<File[]>([])

    return (
      <div>
        <DropZone.Root
          className={dropZoneTheme.root}
          {...args}
          onDrop={(files) => {
            setRejected([])
            setFiles(files)
          }}
          onReject={(files) => setRejected(files)}
        >
          Drop an audio file here
        </DropZone.Root>
        <ul>
          {files.map((file) => (
            <li key={file.name}>
              {file.name} ({file.type || 'unknown type'})
            </li>
          ))}
        </ul>
        {rejected.length > 0 && (
          <p>Not audio: {rejected.map((file) => file.name).join(', ')}</p>
        )}
      </div>
    )
  },
}
