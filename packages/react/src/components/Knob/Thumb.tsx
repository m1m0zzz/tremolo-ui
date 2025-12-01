import clsx from 'clsx'
import { SVGProps } from 'react'

import { clamp } from '@tremolo-ui/functions'

import { useKnobContext, viewBoxSize } from './context'

interface Props {
  /** color */
  thumb?: string
  /** color */
  thumbLine?: string
  /** percent (0-100) */
  thumbSize?: number
  /** percent (0-100) */
  thumbLineWeight?: number
  /** percent (0-100) */
  thumbLineLength?: number

  classes?: {
    thumb?: string
    thumbLine?: string
  }
}

/** @category Knob */
export function Thumb({
  className,

  thumb = 'currentColor',
  thumbLine = 'currentColor',
  thumbSize = 84,
  thumbLineWeight = 6,
  thumbLineLength = 35,
  classes,

  ...props
}: Props & Omit<SVGProps<SVGSVGElement>, 'd' | keyof Props>) {
  const angleRange = useKnobContext((s) => s.angleRange)

  const p = useKnobContext((s) => s.p)
  const r1 = useKnobContext((s) => s.r1)

  return (
    <svg className={clsx('tremolo-knob-thumb', classes?.thumb)} {...props}>
      <circle cx="50%" cy="50%" r={`${thumbSize / 2}%`} fill={thumb} />
      <line
        className={clsx('tremolo-knob-thumb-line', classes?.thumbLine)}
        x1="50%"
        y1={`${(viewBoxSize - clamp(thumbSize, 0, 100)) / 2}%`}
        x2="50%"
        y2={`${thumbLineLength}%`}
        stroke={thumbLine}
        strokeWidth={`${thumbLineWeight}%`}
        // NOTE
        // https://bugs.webkit.org/show_bug.cgi?id=201854
        // https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform-origin#browser_compatibility
        style={{
          transform: `rotate(${r1 + p * angleRange}deg)`,
          transformOrigin: '50% 50%',
        }}
      />
    </svg>
  )
}
