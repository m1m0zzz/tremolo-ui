// expand begin
import { noteName, noteNumber } from '@tremolo-ui/functions'
import { Piano, SHORTCUTS } from '@tremolo-ui/react'
import * as Tone from 'tone'

import '@tremolo-ui/react/styles/index.css'
// expand end

function App() {
  const synth = new Tone.PolySynth({ volume: -6 }).toDestination()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Piano
        noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
        keyboardShortcuts={SHORTCUTS.HOME_ROW}
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
    // expand end
  )
}

// expand begin
export default App
// expand end
