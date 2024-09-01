/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { useMemo, useRef } from 'react'

import { WheelOption } from '@/global-type'
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
  thumb?: string
  lineWeight?: number | string
  thumbWeight?: number | string
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
  size = 50,
  active = '#7998ec',
  inactive = '#eee',
  bg = '#ccc',
  thumb = '#4e76e6',
  lineWeight = 12,
  thumbWeight = 4,
  cursor = 'pointer',
  style,
  bodyNoSelect = true,
  enableWheel,
  onChange,
}: KnobProps) {
  // -- state and ref ---
  // const [privateValue, setPrivateValue] = useState(value);
  const dragOffsetY = useRef<number | undefined>(undefined)

  // --- interpret props ---
  const percent = normalizeValue(value, min, max, skew)

  const handleValue = (
    event: MouseEvent | React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (dragOffsetY.current) {
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
  const wrapperRef = useMemo(() => {
    let cleanup: (() => void) | undefined
    return (div: HTMLDivElement | null) => {
      if (!div) {
        cleanup?.()
        return
      }
      const controller = new AbortController()

      div.addEventListener(
        'wheel',
        (event) => {
          if (!enableWheel) return
          event.preventDefault()
          const x = event.deltaY > 0 ? -enableWheel[1] : enableWheel[1]
          let v
          if (enableWheel[0] == 'normalized') {
            const n = normalizeValue(value, min, max, skew)
            v = rawValue(n + x, min, max, skew)
          } else {
            v = value + x
          }
          if (onChange) onChange(clamp(stepValue(v, step), min, max))
        },
        {
          signal: controller.signal,
          passive: false,
        },
      )

      cleanup = () => {
        // console.log("cleanup")
        controller.abort()
      }
    }
  }, [value])

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
      ref={wrapperRef}
      onMouseDown={(event) => {
        dragOffsetY.current = event.screenY
        handleValue(event)
      }}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        ...style,
      }}
    >
      <div
        css={css({
          display: 'inline-block',
          width: size,
          height: size,
          background: `conic-gradient(${active} ${percent * 270}deg, ${inactive} ${percent * 270}deg, ${inactive} ${270}deg, ${bg} 90deg)`,
          borderRadius: '50%',
          position: 'relative',
          cursor: cursor,
          rotate: '-135deg',
          '&::before': {
            display: 'block',
            position: 'absolute',
            right: 0,
            left: 0,
            top: 0,
            bottom: 0,
            margin: 'auto',
            content: '""',
            width: `calc(${styleHelper(size)} - ${styleHelper(lineWeight)})`,
            height: `calc(${styleHelper(size)} - ${styleHelper(lineWeight)})`,
            backgroundColor: bg,
            borderRadius: '50%',
          },
          '&::after': {
            display: 'block',
            position: 'absolute',
            top: 0,
            bottom: 0,
            // left: lineWeight,
            margin: 'auto 0',
            content: '""',
            width: `calc(0.5 * ${styleHelper(size)})`,
            height: thumbWeight,
            borderRadius: thumbWeight,
            backgroundColor: thumb,
            rotate: `${90 + percent * 270}deg`,
            transformOrigin: '100% 50%',
          },
        })}
      >
        <Global
          styles={{
            '.no-select': {
              userSelect: 'none',
            },
          }}
        />
      </div>
    </div>
  )
}
