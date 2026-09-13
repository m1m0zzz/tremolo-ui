import { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import * as Tone from 'tone'

import {
  inScale,
  noteKey,
  noteName,
  noteNumber,
  type ScaleName,
} from '@tremolo-ui/functions'

import { useMIDIAccess } from '../../hooks/useMIDIAccess'
import { useMIDIInput } from '../../hooks/useMIDIInput'

import { Piano, PianoMethods, SHORTCUTS } from '.'

import pianoTheme from 'shared/css/Piano.module.css'

export default {
  title: 'Components/Piano/Root',
  component: Piano.Root,
} satisfies Meta<typeof Piano.Root>

type Story = StoryObj<typeof Piano.Root>

export const Basic: Story = {
  args: {
    noteRange: { first: noteNumber('C3'), last: noteNumber('B4') },
    keyboardShortcuts: SHORTCUTS.HOME_ROW,
  },
  render: (args) => {
    const synth = new Tone.PolySynth({ volume: -6 }).toDestination()

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
        <Piano.Root
          className={pianoTheme.root}
          classes={{
            keyLabelWrapper: pianoTheme.keyLabelWrapper,
            keyLabel: pianoTheme.keyLabel,
          }}
          keyProps={(_note, { keyType }) => ({
            className:
              keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
          })}
          {...args}
          onPlayNote={(noteNumber) => {
            synth.triggerAttack(noteName(noteNumber))
          }}
          onStopNote={(noteNumber) => {
            synth.triggerRelease(noteName(noteNumber))
          }}
          label={(_, { index }) => SHORTCUTS.HOME_ROW.keys[index]}
        />
      </div>
    )
  },
}

/** The range is picked with the selects, so it is not an arg. */
export const Range: Story = {
  render: (args) => {
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
        <Piano.Root
          className={pianoTheme.root}
          classes={{
            keyLabelWrapper: pianoTheme.keyLabelWrapper,
            keyLabel: pianoTheme.keyLabel,
          }}
          keyProps={(_note, { keyType }) => ({
            className:
              keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
          })}
          {...args}
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
  },
}

/**
 * Both key types are styled through `keyProps`, and only the C keys get a
 * label. Neither needs a component per key.
 */
export const Styling: Story = {
  args: {
    noteRange: { first: noteNumber('C3'), last: noteNumber('B4') },
    keyboardShortcuts: SHORTCUTS.HOME_ROW,
  },
  render: (args) => (
    <Piano.Root
      className={pianoTheme.root}
      classes={{
        keyLabelWrapper: pianoTheme.keyLabelWrapper,
        keyLabel: pianoTheme.keyLabel,
      }}
      {...args}
      keyProps={(_, { keyType }) =>
        keyType === 'white'
          ? {
              className: pianoTheme.whiteKey,
              style: { '--bg': '#83888a', '--active-bg': '#5acee8' },
            }
          : {
              className: pianoTheme.blackKey,
              style: { '--bg': '#333536', '--active-bg': '#5acee8' },
            }
      }
      label={(note, { keyType }) =>
        keyType === 'white' && noteKey(note) === 'C'
          ? noteName(note)
          : undefined
      }
    />
  ),
}

/**
 * `keyProps` is given the note, so anything derived from it in JavaScript can
 * reach the keys. A scale is a set of pitch classes that CSS cannot compute on
 * its own.
 *
 * Playing a highlighted key gives a colour of its own: `--active-bg` is set
 * alongside `--bg`, so the key CSS does the switching and the callback does
 * not have to look at `state.active`.
 */
export const ScaleHighlight: Story = {
  args: {
    noteRange: { first: noteNumber('C3'), last: noteNumber('B4') },
  },
  render: (args) => {
    const [root, setRoot] = useState(noteNumber('D3'))
    const [scale, setScale] = useState<ScaleName>('major')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <label>
            root:{' '}
            <select
              value={root}
              onChange={(e) => setRoot(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={noteNumber('C3') + i}>
                  {noteKey(noteNumber('C3') + i)}
                </option>
              ))}
            </select>
          </label>
          <label>
            scale:{' '}
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value as ScaleName)}
            >
              {(
                [
                  'major',
                  'naturalMinor',
                  'harmonicMinor',
                  'majorPentatonic',
                  'minorPentatonic',
                  'blues',
                  'dorian',
                  'wholeTone',
                ] satisfies ScaleName[]
              ).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Piano.Root
          className={pianoTheme.root}
          classes={{
            keyLabelWrapper: pianoTheme.keyLabelWrapper,
            keyLabel: pianoTheme.keyLabel,
          }}
          {...args}
          keyProps={(note, { keyType }) => ({
            className:
              keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
            ...(inScale(note, root, scale)
              ? {
                  style:
                    keyType === 'white'
                      ? { '--bg': '#bfe3ff', '--active-bg': '#3f9ae0' }
                      : {
                          '--bg': '#2f5d84',
                          '--active-bg': '#3f9ae0',
                          '--active-color': '#04121d',
                        },
                }
              : {}),
          })}
        />
      </div>
    )
  },
}

/**
 * `SHORTCUTS.HOME_ROW_NATURAL` puts an empty string where a key has no
 * shortcut, so the black keys are silent and carry no label.
 */
export const NaturalShortcuts: Story = {
  args: {
    noteRange: { first: noteNumber('C3'), last: noteNumber('E4') },
    keyboardShortcuts: SHORTCUTS.HOME_ROW_NATURAL,
  },
  render: (args) => {
    const synth = new Tone.PolySynth({ volume: -6 }).toDestination()

    return (
      <Piano.Root
        className={pianoTheme.root}
        classes={{
          keyLabelWrapper: pianoTheme.keyLabelWrapper,
          keyLabel: pianoTheme.keyLabel,
        }}
        keyProps={(_note, { keyType }) => ({
          className:
            keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
        })}
        {...args}
        onPlayNote={(note) => synth.triggerAttack(noteName(note))}
        onStopNote={(note) => synth.triggerRelease(noteName(note))}
        label={(_, { index }) =>
          SHORTCUTS.HOME_ROW_NATURAL.keys[index]?.toUpperCase()
        }
      />
    )
  },
}

export const Fill: Story = {
  args: {
    noteRange: { first: noteNumber('C3'), last: noteNumber('B3') },
    fill: true,
  },
  render: (args) => (
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
      <Piano.Root
        className={pianoTheme.root}
        classes={{
          keyLabelWrapper: pianoTheme.keyLabelWrapper,
          keyLabel: pianoTheme.keyLabel,
        }}
        keyProps={(_note, { keyType }) => ({
          className:
            keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
        })}
        {...args}
      />
    </div>
  ),
}

export const WithWebMidiAPI: Story = {
  args: {
    noteRange: { first: noteNumber('C3'), last: noteNumber('B4') },
  },
  render: (args) => {
    const pianoRef = useRef<PianoMethods>(null)

    const { midiAccess, error, request } = useMIDIAccess(false)
    useMIDIInput(midiAccess, {
      onNoteOnEvent: (note, velocity) => {
        pianoRef.current?.playNote(note, velocity / 127)
      },
      onNoteOffEvent: (note) => {
        pianoRef.current?.stopNote(note)
      },
    })

    const synth = new Tone.PolySynth({ volume: -6 }).toDestination()

    return (
      <div>
        <p>
          with{' '}
          <a
            href="https://developer.mozilla.org/ja/docs/Web/API/Web_MIDI_API"
            target="_blank"
            rel="noopener noreferrer"
          >
            Web MIDI API
          </a>
        </p>
        {midiAccess ? null : (
          <p>
            <button type="button" onClick={() => request()}>
              request MIDI Keyboard
            </button>
          </p>
        )}
        {error && <p>error: {error}</p>}

        <Piano.Root
          className={pianoTheme.root}
          classes={{
            keyLabelWrapper: pianoTheme.keyLabelWrapper,
            keyLabel: pianoTheme.keyLabel,
          }}
          keyProps={(_note, { keyType }) => ({
            className:
              keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
          })}
          {...args}
          ref={pianoRef} // emit midi event
          onPlayNote={(noteNumber, velocity) => {
            synth.triggerAttack(noteName(noteNumber), 0, velocity)
          }}
          onStopNote={(noteNumber) => {
            synth.triggerRelease(noteName(noteNumber))
          }}
          label={(_, { index }) => SHORTCUTS.HOME_ROW.keys[index]}
        />
      </div>
    )
  },
}
