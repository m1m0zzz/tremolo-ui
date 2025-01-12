import { Meta } from '@storybook/react'
import { noteNumber, noteName } from '@tremolo-ui/functions'
import { useState } from 'react'

import { BlackKey, Piano, WhiteKey } from '../src/components/Piano'
import { NumberInput } from '../src/components/NumberInput'

export default {
  title: 'React/Components/Piano',
  component: Piano,
  tags: ['autodocs'],
} satisfies Meta<typeof Piano>

export const Basic = () => {
  const [first, setFirst] = useState(noteNumber('C3'))
  const [last, setLast] = useState(noteNumber('B5'))
  return (
    <div>
      <div
        style={{
          marginBottom: '1rem',
        }}
      >
        <label>first note:{' '}
          <select value={first} onChange={(e) => setFirst(parseInt(e.target.value))}>
            {[...Array(127)].map((_, i) => (
              <option key={i} value={i} disabled={i > last}>
                {noteName(i)}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>last note:{' '}
          <select value={last} onChange={(e) => setLast(parseInt(e.target.value))}>
          {[...Array(127)].map((_, i) => (
            <option key={i} value={i} disabled={i < first}>
              {noteName(i)}
            </option>
          ))}
          </select>
        </label>
      </div>
      <Piano
        noteRange={{ first: first, last: last }}
      />
    </div>
  )
}

export const Styling = () => {
 return (
    <Piano
      noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
    >
      <WhiteKey
        width={60}
        bg='aquamarine'
        activeBg='#73e6c0'
      />
      <BlackKey width={60 * 0.65} />
    </Piano>
 )
}

export const OneOctave = () => {
  const [octave, setOctave] = useState(3)
  return (
    <div>
      <NumberInput
        value={octave}
        min={-1}
        max={9}
        onChange={(v) => setOctave(v)}
        typeNumber
        style={{ display: 'block', marginBottom: '1rem' }}
      />
      <Piano
        noteRange={{ first: noteNumber(`C${octave}`), last: noteNumber(`B${octave + 1}`) }}
      />
    </div>
  )
}
