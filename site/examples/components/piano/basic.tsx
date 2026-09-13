// expand begin
import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

import { noteName, noteNumber } from '@tremolo-ui/functions'
import { Piano, SHORTCUTS } from '@tremolo-ui/react'

// Copy this file from the Styling page into your own project.
import pianoTheme from './Piano.module.css'

// expand end

function App() {
  const synthRef = useRef<Tone.PolySynth | null>(null)

  useEffect(() => {
    const synth = new Tone.PolySynth({ volume: -6 }).toDestination()
    synthRef.current = synth

    return () => {
      synth.releaseAll()
      synth.dispose()
      if (synthRef.current === synth) synthRef.current = null
    }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
        noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
        keyboardShortcuts={SHORTCUTS.HOME_ROW}
        onPlayNote={(noteNumber) => {
          synthRef.current?.triggerAttack(noteName(noteNumber))
        }}
        onStopNote={(noteNumber) => {
          synthRef.current?.triggerRelease(noteName(noteNumber))
        }}
        label={(_, { index }) => SHORTCUTS.HOME_ROW.keys[index]?.toUpperCase()}
      />
    </div>
    // expand end
  )
}

// expand begin
export default App
// expand end
