import { fn } from '@storybook/test'

import { Header } from './Header'

import type { HeaderProps } from './Header'
import type { Meta, StoryObj } from '@storybook/web-components'

const meta = {
  title: 'Example/Header',
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  render: (args: HeaderProps) => Header(args),
  args: {
    onLogin: fn(),
    onLogout: fn(),
    onCreateAccount: fn(),
  },
} satisfies Meta<HeaderProps>

export default meta
type Story = StoryObj<HeaderProps>

export const LoggedIn: Story = {
  args: {
    user: {
      name: 'Jane Doe',
    },
  },
}

export const LoggedOut: Story = {}
