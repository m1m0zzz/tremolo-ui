import { useAtom } from 'jotai'
import { useMemo, useRef } from 'react'
import { RiAddLine, RiSubtractLine } from 'react-icons/ri'
import { start } from 'tone'

import { SHORTCUTS } from '@tremolo-ui/dom'
import { clamp, noteNumber } from '@tremolo-ui/functions'
import {
  Knob,
  NumberInput,
  Piano,
  type PianoMethods,
  useEventListener,
  useMIDIAccess,
  useMIDIInput,
} from '@tremolo-ui/react'

import {
  MAX_OCTAVE,
  MAX_VELOCITY,
  MIN_OCTAVE,
  MIN_VELOCITY,
  octaveAtom,
  velocityAtom,
} from './atoms'

import styles from './KeyboardSection.module.css'
import knobTheme from 'shared/css/Knob.module.css'
import pianoTheme from 'shared/css/Piano.module.css'

/** How many octaves the keyboard draws, from the C of the chosen octave. */
const OCTAVES = 2

/** How far C / V move the velocity, as in the computer keyboards of DAWs. */
const VELOCITY_STEP = 20

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.matches('input, textarea, select') || target.isContentEditable)
  )
}

interface Props {
  themeColor?: string
  /**
   * Whether the computer keyboard plays the synth: only while the focus is
   * inside it, so that other things on the page keep their keys.
   */
  shortcuts?: boolean
  /** `velocity` is 0-1: from the MIDI keyboard, or the velocity knob otherwise. */
  onPlayNote?: (note: number, velocity: number) => void
  onStopNote?: (note: number) => void
}

export function KeyboardSection({
  themeColor = 'rgb(67, 170, 248)',
  shortcuts = true,
  onPlayNote,
  onStopNote,
}: Props) {
  const pianoRef = useRef<PianoMethods>(null)
  const [octave, setOctave] = useAtom(octaveAtom)
  const [velocity, setVelocity] = useAtom(velocityAtom)

  const noteRange = useMemo(() => {
    const first = noteNumber(`C${octave}`)
    return { first, last: first + OCTAVES * 12 - 1 }
  }, [octave])

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
  useEventListener(window, 'keydown', (e) => {
    if (!shortcuts) return
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
          {/* The octave of the lowest key, so 3 starts the keyboard at C3. */}
          <NumberInput.Root
            value={octave}
            min={MIN_OCTAVE}
            max={MAX_OCTAVE}
            selectOnFocus="number"
            className={styles.octave}
            onChange={(v) => setOctave(v)}
          >
            <NumberInput.DecrementStepper
              className={styles.stepper}
              aria-label="Octave down"
            >
              <RiSubtractLine aria-hidden />
            </NumberInput.DecrementStepper>
            <NumberInput.InputField
              className={styles.octaveField}
              aria-label="Octave"
            />
            <NumberInput.IncrementStepper
              className={styles.stepper}
              aria-label="Octave up"
            >
              <RiAddLine aria-hidden />
            </NumberInput.IncrementStepper>
          </NumberInput.Root>
        </div>
        <div className={styles.control}>
          <span className="label">Velocity</span>
          <Knob.Root
            className={knobTheme.root}
            value={velocity}
            min={MIN_VELOCITY}
            max={MAX_VELOCITY}
            resetValue={100}
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
                classes={{ line: knobTheme.thumbLine }}
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
              className={styles.connect}
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
        actionsRef={pianoRef}
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
        // On the window, but only while the synth has the focus: turning them
        // off when it leaves lets go of any note still held.
        keyboardShortcutsScope={'window'}
        keyboardShortcuts={shortcuts ? SHORTCUTS.HOME_ROW : undefined}
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
