// expand begin
import { useState } from 'react'

import { DropZone } from '@tremolo-ui/react'

// Copy this file from the Styling page into your own project.
import dropZoneTheme from './DropZone.module.css'
// expand end

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [rejected, setRejected] = useState<File[]>([])

  return (
    <div>
      <DropZone.Root
        className={dropZoneTheme.root}
        accept="audio/*"
        multiple
        onDrop={(files) => {
          setRejected([])
          setFiles(files)
        }}
        onReject={(files) => setRejected(files)}
      >
        Drop an audio file here
      </DropZone.Root>
      <ul>
        {files.map((file) => (
          <li key={file.name}>
            {file.name} ({file.type || 'unknown type'})
          </li>
        ))}
      </ul>
      {rejected.length > 0 && (
        <p>Not audio: {rejected.map((file) => file.name).join(', ')}</p>
      )}
    </div>
  )
}

// expand begin
export default App
// expand end
