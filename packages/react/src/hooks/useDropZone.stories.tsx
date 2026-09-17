import { useState } from 'react'

import { useDropZone } from './useDropZone'

export default {
  title: 'Hooks/useDropZone',
}

/**
 * The hook turns any element into a drop target, without wrapping it in
 * anything. Here it is a `<canvas>` — the same thing a waveform display or a
 * track lane would do.
 */
export const Basic = () => {
  const [dropped, setDropped] = useState<string[]>([])

  const { refCallback, over, invalid } = useDropZone<HTMLCanvasElement>({
    accept: 'audio/*',
    multiple: true,
    onDrop: (files) => setDropped(files.map((file) => file.name)),
  })

  return (
    <div>
      <canvas
        ref={refCallback}
        width={320}
        height={120}
        style={{
          border: `2px dashed ${invalid ? 'crimson' : over ? 'royalblue' : 'currentColor'}`,
          borderRadius: 8,
        }}
      />
      <div>over: {String(over)}</div>
      <div>invalid: {String(invalid)}</div>
      <div>dropped: {dropped.join(', ') || 'nothing yet'}</div>
    </div>
  )
}
