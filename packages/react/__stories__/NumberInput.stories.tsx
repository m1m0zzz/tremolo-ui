import { Meta } from '@storybook/react'
import { useState } from 'react'

import { NumberInput } from '../src/components/NumberInput'

const meta = {
  title: 'React/Components/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  // argTypes: {
  //   value: {
  //     control: 'number',
  //   },
  //   units: {
  //     // options: ['ms', [['ms', 1], ['s', 1000]]],
  //     control: 'object',
  //   },
  //   // strict: {
  //   //   control: 'boolean'
  //   // }
  // },
} satisfies Meta<typeof NumberInput>
export default meta

// export const Basic: StoryObj<typeof meta> = {
//   args: {
//     value: 32,
//     units: [
//       ['Hz', 1],
//       ['kHz', 1000],
//     ],
//   },
// }

export const Basic = () => {
  const [value, setValue] = useState(32)

  return (
    <NumberInput
      value={value}
      units={[
        ['Hz', 1],
        ['kHz', 1000],
      ]}
      onChange={(v) => setValue(v)}
    />
  )
}

// export const Basic = () => {
//   const [value, setValue] = useState(32)

//   return <NumberInput value={value} onChange={(v) => setValue(v)} />
// }
