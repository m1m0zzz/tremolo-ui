import { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { unitFormat, type InputEventOptions } from '@tremolo-ui/functions'

import { NumberInput } from '.'

export default {
  title: 'Components/NumberInput/InputField',
  component: NumberInput.InputField,
} satisfies Meta<typeof NumberInput.InputField>

type Story = StoryObj<typeof NumberInput.InputField>

/** `format` and `parse` come as a pair, so they spread in together. */
const hz = unitFormat('Hz')

/**
 * With `unformatOnFocus`, focusing the input drops whatever `format` put
 * around the value and shows the number itself, ready to be typed over.
 * Both fields hold the same value; only the left one keeps its format while
 * you are in it.
 */
export const UnformatOnFocus = () => {
  const [left, setLeft] = useState(1230)
  const [right, setRight] = useState(1230)

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <section>
        <p>default</p>
        <NumberInput.Root value={left} {...hz} onChange={setLeft}>
          <NumberInput.InputField />
        </NumberInput.Root>
      </section>
      <section>
        <p>unformatOnFocus</p>
        <NumberInput.Root value={right} {...hz} onChange={setRight}>
          <NumberInput.InputField unformatOnFocus />
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
      </section>
    </div>
  )
}

/**
 * `keepCaretOnStep` puts the caret back where it was after an arrow key steps
 * the value, so a column can be held while stepping. Click between two digits
 * and hold the up arrow, then turn it on in Controls to compare.
 *
 * How far a press moves the value is `keyboard`'s to say, not the caret's, so
 * both it and `step` can be changed below.
 */
export const KeepCaretOnStep: Story = {
  args: {
    keepCaretOnStep: false,
  },
  render: (args) => {
    const [value, setValue] = useState(1234.5)
    const [step, setStep] = useState(0.1)
    // `keyboard` is a tuple, or a map of them by modifier, so there is no
    // control that fits it. It is typed as JSON instead, and the last text
    // that parsed stands while the next one is half written.
    const [keyboardText, setKeyboardText] = useState('["raw", 0.1]')
    const [keyboard, setKeyboard] = useState<InputEventOptions>(['raw', 0.1])

    return (
      <div>
        <NumberInput.Root
          value={value}
          step={step}
          keyboard={keyboard}
          onChange={setValue}
        >
          <NumberInput.InputField {...args} />
          <NumberInput.Stepper>
            <NumberInput.IncrementStepper />
            <NumberInput.DecrementStepper />
          </NumberInput.Stepper>
        </NumberInput.Root>
        <p>config</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>step: </span>
          <NumberInput.Root value={step} step={0.01} min={0} onChange={setStep}>
            <NumberInput.InputField />
          </NumberInput.Root>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>keyboard: </span>
          <input
            type="text"
            size={36}
            value={keyboardText}
            onChange={(event) => {
              const text = event.currentTarget.value
              setKeyboardText(text)
              try {
                setKeyboard(JSON.parse(text))
              } catch {
                // Half written JSON. Keep the last one that parsed.
              }
            }}
          />
        </div>
      </div>
    )
  },
}

export const SelectOnFocus = () => {
  const [value1, setValue1] = useState(32)
  const [value2, setValue2] = useState(32)
  const [value3, setValue3] = useState(32)

  const data: {
    selectOnFocus: 'none' | 'all' | 'number'
    v: number
    setter: (v: number) => void
  }[] = [
    { selectOnFocus: 'none', v: value1, setter: setValue1 },
    { selectOnFocus: 'all', v: value2, setter: setValue2 },
    { selectOnFocus: 'number', v: value3, setter: setValue3 },
  ]

  return (
    <div>
      {data.map(({ selectOnFocus, v, setter }) => (
        <section key={selectOnFocus} style={{ marginBottom: '2rem' }}>
          <p>selectOnFocus=&apos;{selectOnFocus}&apos;</p>
          <NumberInput.Root value={v} {...hz} onChange={setter}>
            <NumberInput.InputField selectOnFocus={selectOnFocus} />
          </NumberInput.Root>
        </section>
      ))}
    </div>
  )
}
