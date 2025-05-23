import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import * as Tone from 'tone'

import { noteNumber, noteName, isWhiteKey } from '@tremolo-ui/functions'

import {
  DecrementStepper,
  IncrementStepper,
  NumberInput,
  Stepper,
} from '../src/components/NumberInput'
import {
  BlackKey,
  getNoteRangeArray,
  KeyLabel,
  Piano,
  SHORTCUTS,
  WhiteKey,
} from '../src/components/Piano'

import { sizesOptionType } from './lib/typeUtils'

export default {
  title: 'Components/Piano',
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
    keyboardShortcuts: SHORTCUTS.HOME_ROW,
  },
  render: (args) => {
    const synth = new Tone.PolySynth({ volume: -6 }).toDestination()
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
          onPlayNote={(noteNumber) => {
            synth.triggerAttack(noteName(noteNumber))
          }}
          onStopNote={(noteNumber) => {
            synth.triggerRelease(noteName(noteNumber))
          }}
          // Notice: need optional chaining (?.)
          label={(_, i) => SHORTCUTS.HOME_ROW.keys[i]?.toUpperCase()}
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
        label={(note) => {
          return [
            'ド',
            undefined,
            'レ',
            undefined,
            'ミ',
            'ファ',
            undefined,
            'ソ',
            undefined,
            'ラ',
            undefined,
            'シ',
          ].at(note % 12)
        }}
      />
    </div>
  )
}

export const Styling = () => {
  const range = { first: noteNumber('C3'), last: noteNumber('B4') }
  const [activeIndex, setActiveIndex] = useState(-1)

  return (
    <Piano noteRange={range} keyboardShortcuts={SHORTCUTS.HOME_ROW}>
      {getNoteRangeArray(range).map((note, index) => {
        return isWhiteKey(note) ? (
          <WhiteKey
            key={note}
            noteNumber={note}
            bg={activeIndex == index ? 'red' : '#83888a'}
            activeBg="#5acee8"
            onClick={() => setActiveIndex(index)}
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
        ) : (
          <BlackKey
            key={note}
            noteNumber={note}
            bg={activeIndex == index ? 'red' : '#333536'}
            activeBg="#5acee8"
            onClick={() => setActiveIndex(index)}
          />
        )
      })}
    </Piano>
  )
}

export const OneOctave = () => {
  const [octave, setOctave] = useState(3)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <NumberInput
        value={octave}
        min={-1}
        max={9}
        onChange={(v) => setOctave(v)}
      >
        <Stepper>
          <IncrementStepper />
          <DecrementStepper />
        </Stepper>
      </NumberInput>
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
