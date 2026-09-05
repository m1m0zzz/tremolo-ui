import { useRef, useState } from 'react'
import * as Tone from 'tone'

import { noteName, noteNumber } from '@tremolo-ui/functions'

import { Piano, PianoMethods } from '../src/components/Piano'
import { useMIDIAccess } from '../src/hooks/useMIDIAccess'
import { PITCH_BEND_CENTER, useMIDIInput } from '../src/hooks/useMIDIInput'

export default {
  title: 'Hooks/useMIDIInput',
}

/** MIDI counts channels from 0, hardware labels them from 1. */
function channelLabel(channel: number) {
  return `ch ${channel + 1}`
}

export const Basic = () => {
  const pianoRef = useRef<PianoMethods>(null)

  // One synth for the life of the story. This component re-renders on every
  // MIDI event, so a synth built during render would leave one behind per event.
  const synthRef = useRef<Tone.PolySynth | null>(null)
  function synth() {
    synthRef.current ??= new Tone.PolySynth({ volume: -6 }).toDestination()
    return synthRef.current
  }

  const [lastNote, setLastNote] = useState('-')
  const [bend, setBend] = useState(PITCH_BEND_CENTER)
  const [controlChange, setControlChange] = useState('-')
  const [programChange, setProgramChange] = useState('-')
  const [pressure, setPressure] = useState('-')

  const { request, midiAccess, error } = useMIDIAccess(false)

  // Written inline on purpose: the handlers are read fresh on every event, so
  // a re-render never detaches a listener.
  useMIDIInput(midiAccess, {
    // The sound hangs off the piano's own onPlayNote / onStopNote, so a note
    // played with the mouse is heard as well.
    onNoteOnEvent: (note, velocity, channel) => {
      pianoRef.current?.playNote(note, velocity / 127)
      setLastNote(
        `${noteName(note)} on, velocity ${velocity} (${channelLabel(channel)})`,
      )
    },
    onNoteOffEvent: (note, channel) => {
      pianoRef.current?.stopNote(note)
      setLastNote(`${noteName(note)} off (${channelLabel(channel)})`)
    },
    onPitchBendEvent: (value) => setBend(value),
    onControlChangeEvent: (controller, value, channel) =>
      setControlChange(
        `CC ${controller} = ${value} (${channelLabel(channel)})`,
      ),
    onProgramChangeEvent: (program, channel) =>
      setProgramChange(`${program} (${channelLabel(channel)})`),
    onAftertouchEvent: (note, value, channel) =>
      setPressure(`${noteName(note)}: ${value} (${channelLabel(channel)})`),
    onChannelPressureEvent: (value, channel) =>
      setPressure(`channel: ${value} (${channelLabel(channel)})`),
  })

  // 0-16383 centred at 8192, so -1 to 1 either side of the centre.
  const bendRatio =
    (bend - PITCH_BEND_CENTER) /
    (bend < PITCH_BEND_CENTER ? PITCH_BEND_CENTER : PITCH_BEND_CENTER - 1)

  return (
    <div>
      <p>
        Play a MIDI keyboard: note on / note off light the keys up through{' '}
        <code>Piano.Root</code> and sound a{' '}
        <a
          href="https://tonejs.github.io/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tone.js
        </a>{' '}
        PolySynth, and the other channel voice messages are shown below.
      </p>
      {midiAccess ? null : (
        <p>
          <button
            type="button"
            onClick={() => {
              // A MIDI event is not a user gesture, so the audio context would
              // stay suspended. This click is one.
              void Tone.start()
              request()
            }}
          >
            Request MIDI access
          </button>
        </p>
      )}
      {error && <p>error: {error}</p>}
      {/* 88 keys are wider than the frame, so the keyboard scrolls sideways. */}
      <div
        style={{
          overflowX: 'auto',
          padding: '0.25rem 0',
          marginBottom: '0.5rem',
        }}
      >
        <Piano.Root
          ref={pianoRef}
          noteRange={{ first: noteNumber('A0'), last: noteNumber('C8') }}
          label={(note) => (note % 12 === 0 ? noteName(note) : undefined)}
          onPlayNote={(note, velocity) =>
            synth().triggerAttack(noteName(note), 0, velocity)
          }
          onStopNote={(note) => synth().triggerRelease(noteName(note))}
        />
      </div>
      <div>note: {lastNote}</div>
      <div>
        pitch bend: {bend} ({bendRatio.toFixed(3)})
      </div>
      <div>control change: {controlChange}</div>
      <div>program change: {programChange}</div>
      <div>aftertouch: {pressure}</div>
    </div>
  )
}
