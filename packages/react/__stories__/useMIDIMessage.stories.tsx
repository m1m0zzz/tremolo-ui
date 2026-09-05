import { useRef, useState } from 'react'

import { useMIDIAccess } from '../src/hooks/useMIDIAccess'
import { useMIDIMessage } from '../src/hooks/useMIDIMessage'

export default {
  title: 'Hooks/useMIDIMessage',
}

const LOG_LENGTH = 20

type Log = {
  id: number
  time: string
  bytes: string
}

function hex(byte: number) {
  return byte.toString(16).padStart(2, '0')
}

export const Basic = () => {
  const nextId = useRef(0)
  const [logs, setLogs] = useState<Log[]>([])

  const { request, midiAccess, error } = useMIDIAccess(false)

  // Raw `midimessage` events, system messages included: useMIDIInput decodes
  // the channel voice messages only.
  useMIDIMessage(midiAccess, (event) => {
    if (!event.data) return
    const bytes = [...event.data].map(hex).join(' ')
    setLogs((logs) =>
      [
        { id: nextId.current++, time: event.timeStamp.toFixed(1), bytes },
        ...logs,
      ].slice(0, LOG_LENGTH),
    )
  })

  return (
    <div>
      {midiAccess ? null : (
        <p>
          <button type="button" onClick={() => request()}>
            Request MIDI access
          </button>
        </p>
      )}
      {error && <p>error: {error}</p>}
      <p>
        <button type="button" onClick={() => setLogs([])}>
          Clear
        </button>{' '}
        <span style={{ opacity: 0.7 }}>
          the {LOG_LENGTH} most recent messages, newest first
        </span>
      </p>
      <ol
        style={{
          margin: 0,
          padding: '0.5rem 1rem',
          border: '1px solid black',
          minHeight: '10rem',
          fontFamily: 'monospace',
        }}
      >
        {logs.map((log) => (
          <li key={log.id}>
            <span style={{ opacity: 0.7 }}>{log.time}</span> {log.bytes}
          </li>
        ))}
      </ol>
    </div>
  )
}
