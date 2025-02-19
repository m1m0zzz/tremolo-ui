import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import * as Tone from 'tone'

import { noteNumber, noteName } from '@tremolo-ui/functions'

import { NumberInput } from '../src/components/NumberInput'
import {
  BlackKey,
  KeyLabel,
  Piano,
  Shortcuts,
  WhiteKey,
} from '../src/components/Piano'

import { sizesOptionType } from './lib/typeUtils'

export default {
  title: 'React/Components/Piano',
  component: Piano,
  argTypes: {
    height: {
      table: {
        type: sizesOptionType,
      },
    },
    children: {
      control: false,
    },
  },
} satisfies Meta<typeof Piano>

type Story = StoryObj<typeof Piano>

export const Basic: Story = {
  args: {
    noteRange: { first: noteNumber('C3'), last: noteNumber('B4') },
    keyboardShortcuts: Shortcuts.HOME_ROW,
  },
  render: (args) => {
    const synth = new Tone.PolySynth().toDestination()
    synth.volume.value = -6 // dB
    // synth.set({
    //   oscillator: {
    //     type: 'sine'
    //   }
    // })

    return (
      <div>
        <p>
          Basic piano example with{' '}
          <a
            href="https://tonejs.github.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tone.js
          </a>{' '}
          PolySynth.
        </p>
        <Piano
          {...args}
          playNote={(noteNumber) => {
            synth.triggerAttack(noteName(noteNumber))
          }}
          stopNote={(noteNumber) => {
            synth.triggerRelease(noteName(noteNumber))
          }}
          // Notice: need optional chaining (?.)
          label={(_, i) => Shortcuts.HOME_ROW.keys[i]?.toUpperCase()}
        />
      </div>
    )
  },
}

export const Range = () => {
  const [first, setFirst] = useState(noteNumber('C3'))
  const [last, setLast] = useState(noteNumber('B4'))
  return (
    <div>
      <div
        style={{
          marginBottom: '1rem',
        }}
      >
        <label>
          first note:{' '}
          <select
            value={first}
            onChange={(e) => setFirst(parseInt(e.target.value))}
          >
            {[...Array(127)].map((_, i) => (
              <option key={i} value={i} disabled={i > last}>
                {noteName(i)}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          last note:{' '}
          <select
            value={last}
            onChange={(e) => setLast(parseInt(e.target.value))}
          >
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
        label={(note) => noteName(note)}
      >
        <WhiteKey>
          <KeyLabel
            label={(note) => {
              return [
                'ド',
                '',
                'レ',
                '',
                'ミ',
                'ファ',
                '',
                'ソ',
                '',
                'ラ',
                '',
                'シ',
              ].at(note % 12)
            }}
          />
        </WhiteKey>
        <BlackKey>
          {/* remove label */}
          <KeyLabel label={() => undefined} />
        </BlackKey>
      </Piano>
    </div>
  )
}

export const Styling = () => {
  return (
    <Piano noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}>
      <WhiteKey
        width={60}
        // bg='#83888a'
        // activeBg='#5acee8'
      >
        <KeyLabel
          label={(note) => {
            const name = noteName(note)
            return name.startsWith('C') ? name : undefined
          }}
          style={{
            border: 'none',
            color: 'white',
          }}
        />
      </WhiteKey>
      <BlackKey
        width={60 * 0.65}
        // bg='#333536'
        // activeBg='#5acee8'
      >
        <KeyLabel />
      </BlackKey>
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
        noteRange={{
          first: noteNumber(`C${octave}`),
          last: noteNumber(`B${octave}`),
        }}
        label={(note) => noteName(note)}
      />
    </div>
  )
}

export const Fill = () => {
  return (
    <div
      style={{
        resize: 'both',
        overflow: 'hidden',
        border: 'solid 1px',
        padding: '1rem',
        height: 240,
        minWidth: 320,
        minHeight: 120,
      }}
    >
      <Piano
        noteRange={{ first: noteNumber('C3'), last: noteNumber('B3') }}
        fill
      />
    </div>
  )
}
