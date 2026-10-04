import { SVGProps } from 'react'

import { KNOB_VIEWBOX_SIZE } from '@tremolo-ui/dom'
import { clamp } from '@tremolo-ui/functions'

import { useCheckPlacement } from '../_util/Placement'

import { useKnobContext } from './context'

export interface KnobThumbProps {
  /**
   * Fill colour of the circle.
   * @default 'currentColor'
   */
  color?: string
  /**
   * Colour of the line that points at the value.
   * @default 'currentColor'
   */
  lineColor?: string
  /**
   * Diameter of the circle, as a percentage of the knob.
   * @default 84
   */
  size?: number
  /**
   * Thickness of the line, as a percentage of the knob.
   * @default 6
   */
  lineWeight?: number
  /**
   * How far down the line reaches, as a percentage of the knob from its top.
   * The line starts at the edge of the circle.
   * @default 35
   */
  lineLength?: number

  /**
   * Classes for what the thumb draws inside itself: `line` is the line that
   * points at the value.
   */
  classes?: {
    line?: string
  }
}

export function Thumb({
  className,

  color = 'currentColor',
  lineColor = 'currentColor',
  size = 84,
  lineWeight = 6,
  lineLength = 35,
  classes,

  ...props
}: KnobThumbProps & Omit<SVGProps<SVGSVGElement>, 'd' | keyof KnobThumbProps>) {
  useCheckPlacement('Knob.Thumb', 'Knob.SVGRoot')

  const angleRange = useKnobContext((s) => s.angleRange)

  const p = useKnobContext((s) => s.p)
  const r1 = useKnobContext((s) => s.r1)

  return (
    <svg className={className} {...props}>
      <circle cx="50%" cy="50%" r={`${size / 2}%`} fill={color} />
      <line
        className={classes?.line}
        x1="50%"
        y1={`${(KNOB_VIEWBOX_SIZE - clamp(size, 0, 100)) / 2}%`}
        x2="50%"
        y2={`${lineLength}%`}
        stroke={lineColor}
        strokeWidth={`${lineWeight}%`}
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
