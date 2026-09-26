import { useAtom } from 'jotai'
import { useMemo, useRef } from 'react'
import { start } from 'tone'

import { SHORTCUTS } from '@tremolo-ui/dom'
import { clamp, noteName, noteNumber } from '@tremolo-ui/functions'

import { Knob } from '../../../src/components/Knob'
import { NumberInput } from '../../../src/components/NumberInput'
import { Piano, type PianoMethods } from '../../../src/components/Piano'
import { useEventListener } from '../../../src/hooks/useEventListener'
import { useMIDIAccess } from '../../../src/hooks/useMIDIAccess'
import { useMIDIInput } from '../../../src/hooks/useMIDIInput'

import {
  MAX_OCTAVE,
  MAX_VELOCITY,
  MIN_OCTAVE,
  MIN_VELOCITY,
  octaveAtom,
  velocityAtom,
} from './atoms'

import flushed from './FlushedNumberInput.module.css'
import styles from './KeyboardSection.module.css'
import knobTheme from 'shared/css/Knob.module.css'
import pianoTheme from 'shared/css/Piano.module.css'

export default {
  title: 'combined/WavetableSynth/KeyboardSection',
  tags: ['!autodocs'],
}

/** The range drawn at octave 0. Shifting keeps it two octaves from a C. */
const BASE_FIRST_NOTE = noteNumber('C3')
const BASE_LAST_NOTE = noteNumber('B4')

/** How far C / V move the velocity, as in the computer keyboards of DAWs. */
const VELOCITY_STEP = 20

/** Outside the component, so the listener is not re-attached on every render. */
const windowTarget = () => globalThis.window

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.matches('input, textarea, select') || target.isContentEditable)
  )
}

interface Props {
  themeColor?: string
  /** `velocity` is 0-1: from the MIDI keyboard, or the velocity knob otherwise. */
  onPlayNote?: (note: number, velocity: number) => void
  onStopNote?: (note: number) => void
}

export function KeyboardSection({
  themeColor = 'rgb(67, 170, 248)',
  onPlayNote,
  onStopNote,
}: Props) {
  const pianoRef = useRef<PianoMethods>(null)
  const [octave, setOctave] = useAtom(octaveAtom)
  const [velocity, setVelocity] = useAtom(velocityAtom)

  const noteRange = useMemo(
    () => ({
      first: BASE_FIRST_NOTE + octave * 12,
      last: BASE_LAST_NOTE + octave * 12,
    }),
    [octave],
  )

  const { request, midiAccess, error, inputs } = useMIDIAccess(false)

  // Through the piano rather than straight to the synth, so the keys light up
  // and a note held by the mouse and the MIDI keyboard at once sounds once.
  // Notes outside the drawn range still sound: the piano does not refuse them.
  useMIDIInput(midiAccess, {
    onNoteOnEvent: (note, velocity) =>
      pianoRef.current?.playNote(note, velocity / 127),
    onNoteOffEvent: (note) => pianoRef.current?.stopNote(note),
  })

  // The note shortcuts are on the home row, which leaves Z X C V free. They
  // listen where the piano's do, and like them stay out of the text fields.
  useEventListener(windowTarget, 'keydown', (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
    if (isEditableTarget(e.target)) return
    switch (e.key) {
      case 'z':
        setOctave((o) => clamp(o - 1, MIN_OCTAVE, MAX_OCTAVE))
        break
      case 'x':
        setOctave((o) => clamp(o + 1, MIN_OCTAVE, MAX_OCTAVE))
        break
      case 'c':
        setVelocity((v) => clamp(v - VELOCITY_STEP, MIN_VELOCITY, MAX_VELOCITY))
        break
      case 'v':
        setVelocity((v) => clamp(v + VELOCITY_STEP, MIN_VELOCITY, MAX_VELOCITY))
        break
    }
  })

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.control}>
          <span className="label">Octave</span>
          <NumberInput.Root
            value={octave}
            min={MIN_OCTAVE}
            max={MAX_OCTAVE}
            selectOnFocus="number"
            className={flushed.root}
            onChange={(v) => setOctave(v)}
          >
            <NumberInput.InputField className={flushed.field} />
          </NumberInput.Root>
          <span className={`label ${styles.range}`}>
            {noteName(noteRange.first)} - {noteName(noteRange.last)}
          </span>
        </div>
        <div className={styles.control}>
          <span className="label">Velocity</span>
          <Knob.Root
            className={knobTheme.root}
            value={velocity}
            min={MIN_VELOCITY}
            max={MAX_VELOCITY}
            defaultValue={100}
            onChange={(v) => setVelocity(v)}
            size={30}
          >
            <Knob.SVGRoot>
              <Knob.ActiveLine
                className={knobTheme.activeLine}
                stroke={themeColor}
              />
              <Knob.InactiveLine className={knobTheme.inactiveLine} />
              <Knob.Thumb
                className={knobTheme.thumb}
                classes={{ thumbLine: knobTheme.thumbLine }}
              />
            </Knob.SVGRoot>
          </Knob.Root>
          <span className={`label ${styles.velocity}`}>{velocity}</span>
        </div>
        <p className={`label ${styles.hint}`}>Z / X: octave, C / V: velocity</p>
        <div className={styles.midi}>
          {midiAccess ? (
            <span className="label">
              MIDI:{' '}
              {inputs.length > 0
                ? inputs.map((input) => input.name).join(', ')
                : 'no device'}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                // A MIDI message is not a user gesture, so the audio context
                // would stay suspended until something is clicked. This is one.
                void start()
                request()
              }}
            >
              Connect MIDI keyboard
            </button>
          )}
          {error && <span className="label">error: {error}</span>}
        </div>
      </div>
      <Piano.Root
        ref={pianoRef}
        className={`${pianoTheme.root} ${styles.piano}`}
        classes={{
          keyLabelWrapper: pianoTheme.keyLabelWrapper,
          keyLabel: pianoTheme.keyLabel,
        }}
        keyProps={(_note, { keyType }) => ({
          className:
            keyType === 'white' ? pianoTheme.whiteKey : pianoTheme.blackKey,
        })}
        noteRange={noteRange}
        keyboardShortcutsScope={'window'}
        keyboardShortcuts={SHORTCUTS.HOME_ROW}
        label={(_, { index }) => SHORTCUTS.HOME_ROW.keys[index]?.toUpperCase()}
        style={{ height: 120 }}
        // Only the MIDI keyboard carries a velocity; the mouse and the computer
        // keyboard play at the knob's.
        onPlayNote={(note, v) => onPlayNote?.(note, v ?? velocity / 127)}
        onStopNote={(note) => onStopNote?.(note)}
      />
    </div>
  )
}
