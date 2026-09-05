import { useRef, useState } from 'react'

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

  const [lastNote, setLastNote] = useState('-')
  const [bend, setBend] = useState(PITCH_BEND_CENTER)
  const [controlChange, setControlChange] = useState('-')
  const [programChange, setProgramChange] = useState('-')
  const [pressure, setPressure] = useState('-')

  const { request, midiAccess, error } = useMIDIAccess(false)

  // Written inline on purpose: the handlers are read fresh on every event, so
  // a re-render never detaches a listener.
  useMIDIInput(midiAccess, {
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
        <code>Piano.Root</code>, and the other channel voice messages are shown
        below.
      </p>
      {midiAccess ? null : (
        <p>
          <button type="button" onClick={() => request()}>
            Request MIDI access
          </button>
        </p>
      )}
      {error && <p>error: {error}</p>}
      <Piano.Root
        ref={pianoRef}
        noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
        label={(note) => (note % 12 === 0 ? noteName(note) : undefined)}
        style={{ marginBottom: '0.5rem' }}
      />
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
