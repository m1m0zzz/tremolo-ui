/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { useRef } from 'react'

import { WheelOption } from "@/global-type"
import { useEventListener } from '@/hooks/useEventListener'
import { clamp, normalizeValue, rawValue, stepValue } from '@/math'
import { styleHelper } from '@/util'


interface KnobProps {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // | SkewFunction
  size?: number | string
  active?: string
  inactive?: string
  bg?: string
  lineWeight?: number | string
  cursor?: string
  style?: React.CSSProperties
  bodyNoSelect?: boolean
  enableWheel?: WheelOption
  onChange?: (value: number) => void
}

export function Knob({
  value,
  min,
  max,
  step = 1,
  skew = 1,
  size = 60,
  active = '#4e76e6',
  inactive = '#ccc',
  bg = "#eee",
  lineWeight = 12,
  cursor = 'pointer',
  style,
  bodyNoSelect = true,
  enableWheel,
  onChange,
}: KnobProps) {
  // -- state and ref ---
  // const [privateValue, setPrivateValue] = useState(value);
  const dragOffsetY = useRef<number | undefined>(undefined)
  const wrapperElement = useRef<HTMLDivElement>(null)

  // --- interpret props ---
  const percent = normalizeValue(value, min, max, skew)

  const handleValue = (
    event: MouseEvent | React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (wrapperElement.current && dragOffsetY.current) {
      if (bodyNoSelect) document.body.classList.add('no-select')
      const delta = dragOffsetY.current - event.screenY
      dragOffsetY.current = event.screenY
      const n = normalizeValue(value, min, max, skew)
      const v = rawValue(n + delta / 100, min, max, skew)
      const v2 = clamp(stepValue(v, step), min, max)
      if (onChange) onChange(v2)
    }
  }

  // --- hooks ---
  useEventListener(window, 'mousemove', (event) => {
    handleValue(event)
  })

  useEventListener(window, 'mouseup', () => {
    dragOffsetY.current = undefined
    if (bodyNoSelect) document.body.classList.remove('no-select')
  })

  return (
    <div
      className="tremolo-knob"
      ref={wrapperElement}
      css={css({
        width: size,
        height: size,
        background:
          `conic-gradient(${active} ${percent * 270}deg, ${inactive} ${percent * 270}deg, ${inactive} ${270}deg, ${bg} 90deg)`,
        borderRadius: "50%",
        cursor: cursor,
        display: "grid",
        placeItems: "center",
        rotate: "-135deg",
        "&::before": {
          display: "block",
          content: '""',
          width: `calc(${styleHelper(size)} - ${styleHelper(lineWeight)})`,
          height: `calc(${styleHelper(size)} - ${styleHelper(lineWeight)})`,
          backgroundColor: bg,
          clipPath: "circle()"
        },
        ...style
      })}
      onMouseDown={(event) => {
        dragOffsetY.current = event.screenY
        handleValue(event)
      }}
    >
      <Global
        styles={{
          '.no-select': {
            userSelect: 'none',
          },
        }}
      />
    </div>
  )
}
