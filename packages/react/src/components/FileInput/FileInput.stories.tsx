import { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentProps, useState } from 'react'

import { FileInput } from '.'

import fileInputTheme from 'shared/css/FileInput.module.css'

export default {
  title: 'Components/FileInput/Root',
  component: FileInput.Root,
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof FileInput.Root>

type Story = StoryObj<ComponentProps<typeof FileInput.Root>>

/**
 * The picker is opened by the trigger, and the files come back as `File`s.
 * Anything that does not match `accept` arrives at `onReject` instead, so the
 * reason can be shown — the browser treats the attribute as a hint, and the
 * picker can be switched to "All Files".
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
        <FileInput.Root
          className={fileInputTheme.root}
          {...args}
          onChange={(files) => {
            setRejected([])
            setFiles(files)
          }}
          onReject={(files) => setRejected(files)}
        >
          <FileInput.Trigger className={fileInputTheme.trigger}>
            Choose audio
          </FileInput.Trigger>
          <span>
            {files.length > 0 ? `${files.length} selected` : 'No file'}
          </span>
        </FileInput.Root>
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
