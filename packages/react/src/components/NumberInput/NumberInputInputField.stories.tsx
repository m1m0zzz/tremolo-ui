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
 * around the value and shows the number itself, ready to be typed over. Turn
 * it off in Controls to see the formatted text stay while you are in the
 * field.
 */
export const UnformatOnFocus: Story = {
  args: {
    unformatOnFocus: true,
  },
  render: (args) => {
    const [value, setValue] = useState(1230)

    return (
      <NumberInput.Root value={value} {...hz} onChange={setValue}>
        <NumberInput.InputField {...args} />
        <NumberInput.Stepper>
          <NumberInput.IncrementStepper />
          <NumberInput.DecrementStepper />
        </NumberInput.Stepper>
      </NumberInput.Root>
    )
  },
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

/**
 * What gets selected when the input takes focus. `'number'` covers the leading
 * number and leaves whatever the format appended to it, so a unit is not typed
 * over by accident.
 */
export const SelectOnFocus: Story = {
  args: {
    selectOnFocus: 'all',
  },
  render: (args) => {
    const [value, setValue] = useState(32)

    return (
      <NumberInput.Root value={value} {...hz} onChange={setValue}>
        <NumberInput.InputField {...args} />
      </NumberInput.Root>
    )
  },
}
