import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
} from 'react'

import { useComposedRefs } from '../../compose-refs'
import { cssLength } from '../_util/css-length'
import { Placement } from '../_util/Placement'

import { useXYPadContext } from './context'

export interface XYPadAreaProps {
  /** Sets `--width`; the size the theme gives it stands when omitted. */
  width?: number | string
  /** Sets `--height`. */
  height?: number | string
  /** Sets `--color`. */
  color?: string
  className?: string
  style?: CSSProperties
  /** `<XYPad.Thumb />` goes here. */
  children?: ReactNode
}

type Props = XYPadAreaProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadAreaProps>

export const Area = /* @__PURE__ */ forwardRef<HTMLDivElement, Props>(
  function Area(
    { width, height, color, children, className, style, ...props },
    forwardedRef,
  ) {
    const { areaRef } = useXYPadContext()

    // The area is what the pointer position is normalized against, so the
    // context ref is composed with any ref the caller passed.
    const composedRef = useComposedRefs<HTMLDivElement>(forwardedRef, areaRef)

    return (
      <div
        ref={composedRef}
        className={className}
        style={
          {
            '--color': color,
            '--width': cssLength(width),
            '--height': cssLength(height),
            // The thumb inside is placed against this box.
            position: 'relative',
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        <Placement name="XYPad.Area">{children}</Placement>
      </div>
    )
  },
)
