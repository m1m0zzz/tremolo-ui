import { defineComponent, h } from 'vue'

import { SHORTCUTS } from '@tremolo-ui/dom'
import { isWhiteKey } from '@tremolo-ui/functions'

import { Piano, type KeyState } from '../src'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

import pianoTheme from 'shared/css/Piano.module.css'

const meta = {
  title: 'Components/Piano',
  component: Piano,
  args: {
    noteRange: { first: 48, last: 64 },
    keyboardShortcuts: SHORTCUTS.HOME_ROW,
  },
} satisfies Meta<typeof Piano>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: (args) =>
    defineComponent({
      setup: () => () =>
        h(
          Piano,
          {
            class: pianoTheme.root,
            classes: {
              keyLabelWrapper: pianoTheme.keyLabelWrapper,
              keyLabel: pianoTheme.keyLabel,
            },
            keyProps: (note: number) => ({
              class: isWhiteKey(note)
                ? pianoTheme.whiteKey
                : pianoTheme.blackKey,
            }),
            ...args,
          },
          {
            label: ({ state }: { state: KeyState }) =>
              SHORTCUTS.HOME_ROW.keys[state.index]?.toUpperCase(),
          },
        ),
    }),
}
