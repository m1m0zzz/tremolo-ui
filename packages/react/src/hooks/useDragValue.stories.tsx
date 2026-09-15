import { useRef, useState } from 'react'

import { useComposedRefs } from '../compose-refs'

import { useDragValue } from './useDragValue'

export default {
  title: 'Hooks/useDragValue',
}

const areaStyle = {
  position: 'relative',
  width: 240,
  height: 160,
  marginBottom: '0.5rem',
  border: '1px solid',
  touchAction: 'none',
  userSelect: 'none',
} as const

/** A dot at `x` / `y` percent, with y growing upwards. */
function Dot({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${100 - y}%`,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'currentColor',
        translate: '-50% -50%',
        pointerEvents: 'none',
      }}
    />
  )
}

/**
 * With `baseElementRef`, the value is the position pointed at inside that
 * element, and `updateOnPointerDown` makes a press jump there before the
 * pointer moves at all. The y axis is reversed so that its maximum is at the
 * top.
 */
export const Basic = () => {
  const areaRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState<[number, number]>([50, 50])

  const { refCallback, dragging } = useDragValue<HTMLDivElement>({
    axis: [
      { min: 0, max: 100, step: 1 },
      { min: 0, max: 100, step: 1, reverse: true },
    ],
    baseElementRef: areaRef,
    updateOnPointerDown: true,
    onChange: (value) => setValue(value),
  })
  // The element that starts the drag is also the one the pointer is measured
  // against.
  const ref = useComposedRefs<HTMLDivElement>(areaRef, refCallback)

  return (
    <div>
      <div ref={ref} style={areaStyle}>
        <Dot x={value[0]} y={value[1]} />
      </div>
      <div>dragging: {String(dragging)}</div>
      <div>
        x: {value[0]}, y: {value[1]}
      </div>
    </div>
  )
}

/**
 * With `getValue`, where the pointer is carries no meaning: the value moves
 * away from where it stood by the distance dragged, `pixelRange` pixels
 * covering the whole range. This is how a knob follows a drag, and why the
 * dot here does not jump to the pointer.
 */
export const Relative = () => {
  const [value, setValue] = useState<[number, number]>([50, 50])

  const { refCallback, dragging } = useDragValue<HTMLDivElement>({
    axis: [
      { min: 0, max: 100 },
      { min: 0, max: 100, reverse: true },
    ],
    getValue: () => value,
    pixelRange: 400,
    onChange: (value) => setValue(value),
  })

  return (
    <div>
      <div ref={refCallback} style={areaStyle}>
        <Dot x={value[0]} y={value[1]} />
      </div>
      <div>dragging: {String(dragging)}</div>
      <div>
        x: {value[0].toFixed(1)}, y: {value[1].toFixed(1)}
      </div>
    </div>
  )
}
