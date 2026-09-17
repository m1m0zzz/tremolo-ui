import { SVGProps, CSSProperties } from 'react'

import { clamp } from '@tremolo-ui/functions'

import { useCheckPlacement } from '../_util/Placement'

import { useKnobContext, viewBoxSize } from './context'

import type { CSSVariables } from '../../css-variables'

export interface KnobThumbProps {
  /**
   * Fill colour of the circle.
   * @default 'currentColor'
   */
  thumb?: string
  /**
   * Colour of the line that points at the value.
   * @default 'currentColor'
   */
  thumbLine?: string
  /**
   * Diameter of the circle, as a percentage of the knob.
   * @default 84
   */
  thumbSize?: number
  /**
   * Thickness of the line, as a percentage of the knob.
   * @default 6
   */
  thumbLineWeight?: number
  /**
   * How far down the line reaches, as a percentage of the knob from its top.
   * The line starts at the edge of the circle.
   * @default 35
   */
  thumbLineLength?: number

  /**
   * Classes for what the thumb draws inside itself: `thumbLine` is the line
   * that points at the value.
   */
  classes?: {
    thumbLine?: string
  }

  style?: CSSProperties & CSSVariables
}

export function Thumb({
  className,

  thumb = 'currentColor',
  thumbLine = 'currentColor',
  thumbSize = 84,
  thumbLineWeight = 6,
  thumbLineLength = 35,
  classes,

  ...props
}: KnobThumbProps & Omit<SVGProps<SVGSVGElement>, 'd' | keyof KnobThumbProps>) {
  useCheckPlacement('Knob.Thumb', 'Knob.SVGRoot')

  const angleRange = useKnobContext((s) => s.angleRange)

  const p = useKnobContext((s) => s.p)
  const r1 = useKnobContext((s) => s.r1)

  return (
    <svg className={className} {...props}>
      <circle cx="50%" cy="50%" r={`${thumbSize / 2}%`} fill={thumb} />
      <line
        className={classes?.thumbLine}
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
