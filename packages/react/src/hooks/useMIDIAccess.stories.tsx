import { useState } from 'react'

import { useMIDIAccess } from './useMIDIAccess'

export default {
  title: 'Hooks/useMIDIAccess',
}

const ERROR_HINT = {
  PERMISSION_DENIED: 'You said no. Asking again is worthwhile.',
  NOT_SUPPORTED: 'This browser has no Web MIDI API.',
  UNAVAILABLE: 'The browser could not hand over MIDI access.',
}

export const Basic = () => {
  const [sysex, setSysex] = useState(false)

  // `false`: ask when the button is pressed, not on mount. A permission prompt
  // that appears just because a story was opened is a poor greeting.
  const { request, midiAccess, error, inputs } = useMIDIAccess(false)

  return (
    <div>
      <p>
        <label style={{ marginRight: '0.5rem' }}>
          <input
            type="checkbox"
            checked={sysex}
            onChange={(e) => setSysex(e.target.checked)}
            disabled={!!midiAccess}
          />{' '}
          sysex
        </label>
        <button type="button" onClick={() => request({ sysex })}>
          {midiAccess ? 'Request again' : 'Request MIDI access'}
        </button>
      </p>
      <div>granted: {String(!!midiAccess)}</div>
      <div>
        error: {error ?? 'null'}
        {error && (
          <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
            {ERROR_HINT[error]}
          </span>
        )}
      </div>
      <h3>inputs ({inputs.length})</h3>
      {inputs.length === 0 ? (
        <p style={{ opacity: 0.7 }}>
          No input connected. Plug a keyboard in — the list follows the devices,
          so nothing has to be reloaded.
        </p>
      ) : (
        <ul>
          {inputs.map((input) => (
            <li key={input.id}>
              {input.name ?? '(no name)'}
              <span style={{ opacity: 0.7 }}>
                {' — '}
                {input.manufacturer || 'unknown'}, {input.state},{' '}
                {input.connection}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
