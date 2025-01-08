import { Meta } from '@storybook/react'

import { noteNumber } from '@tremolo-ui/functions'
import { Piano } from '../src/components/Piano'

export default {
  title: 'React/Components/Piano',
  component: Piano,
  tags: ['autodocs'],
} satisfies Meta<typeof Piano>

export const Basic = () => {
  return (
    <Piano
      noteRange={{ first: noteNumber('C3'), last: noteNumber('B5') }}
    />
  )
}
