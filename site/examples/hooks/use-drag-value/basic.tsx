// expand begin
import { useRef, useState } from 'react'

import { useDragValue } from '@tremolo-ui/react'
import { useComposedRefs } from '@tremolo-ui/react/compose-refs'
// expand end

function App() {
  const areaRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState<[number, number]>([50, 50])

  const { refCallback, dragging } = useDragValue<HTMLDivElement>({
    // y is reversed so that its maximum is at the top.
    axis: [
      { min: 0, max: 100, step: 1 },
      { min: 0, max: 100, step: 1, reverse: true },
    ],
    baseElementRef: areaRef,
    updateOnPointerDown: true,
    onChange: (value) => setValue(value),
  })

  // The element that starts the drag is also the one the pointer is measured
  // against, so it takes both refs.
  const ref = useComposedRefs<HTMLDivElement>(areaRef, refCallback)

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={ref}
        style={{
          position: 'relative',
          width: '100%',
          height: 160,
          marginBottom: '0.5rem',
          border: '1px solid currentColor',
          borderRadius: 8,
          touchAction: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${value[0]}%`,
            top: `${100 - value[1]}%`,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'currentColor',
            translate: '-50% -50%',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div>dragging: {String(dragging)}</div>
      <div>
        x: {value[0]}, y: {value[1]}
      </div>
    </div>
  )
}

// expand begin
export default App
// expand end
