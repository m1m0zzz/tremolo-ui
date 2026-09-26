import { defineComponent, h } from 'vue'

import { DropZone } from '../src'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

import dropZoneTheme from 'shared/css/DropZone.module.css'

const meta = {
  title: 'Components/DropZone',
  component: DropZone,
  args: { accept: 'audio/*' },
} satisfies Meta<typeof DropZone>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: (args) =>
    defineComponent({
      setup: () => () =>
        h(
          DropZone,
          { class: dropZoneTheme.root, ...args },
          () => 'Drop audio files here',
        ),
    }),
}
