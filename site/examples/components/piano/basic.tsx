// expand begin
import { noteNumber } from '@tremolo-ui/functions'
import { Piano, Shortcuts } from '@tremolo-ui/react'
// expand end

function App() {
  return (
    <div
      style={{
        width: '100%',
        height: 160,
        margin: 'auto',
        padding: 10,
      }}
    >
      <Piano
        noteRange={{ first: noteNumber('C3'), last: noteNumber('B4') }}
        keyboardShortcuts={Shortcuts.HOME_ROW}
        fill
        // Notice: need optional chaining (?.)
        label={(_, i) => Shortcuts.HOME_ROW.keys[i]?.toUpperCase()}
      />
    </div>
    // expand end
  )
}

// expand begin
export default App
// expand end
