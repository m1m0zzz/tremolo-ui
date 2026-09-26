import { defineComponent, h } from 'vue'

import { FileInput, FileInputTrigger } from '../src'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

import fileInputTheme from 'shared/css/FileInput.module.css'

const meta = {
  title: 'Components/FileInput',
  component: FileInput,
  args: { accept: 'audio/*', multiple: true },
} satisfies Meta<typeof FileInput>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: (args) =>
    defineComponent({
      setup: () => () =>
        h(FileInput, { class: fileInputTheme.root, ...args }, () =>
          h(
            FileInputTrigger,
            { class: fileInputTheme.trigger },
            () => 'Open audio files',
          ),
        ),
    }),
}
