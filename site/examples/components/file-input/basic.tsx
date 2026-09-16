// expand begin
import { useState } from 'react'

import { FileInput } from '@tremolo-ui/react'

// Copy this file from the Styling page into your own project.
import fileInputTheme from './FileInput.module.css'
// expand end

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [rejected, setRejected] = useState<File[]>([])

  return (
    <div>
      <FileInput.Root
        className={fileInputTheme.root}
        accept="audio/*"
        multiple
        onChange={(files) => {
          setRejected([])
          setFiles(files)
        }}
        onReject={(files) => setRejected(files)}
      >
        <FileInput.Trigger className={fileInputTheme.trigger}>
          Choose audio
        </FileInput.Trigger>
        <span>{files.length > 0 ? `${files.length} selected` : 'No file'}</span>
      </FileInput.Root>
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
