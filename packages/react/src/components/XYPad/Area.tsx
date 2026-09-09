import { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from 'react'

import { useComposedRefs } from '../../compose-refs'
import { cssLength } from '../_util/css-length'
import { cx } from '../_util/cx'
import { Placement } from '../_util/placement'

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
  ref?: Ref<HTMLDivElement>
}

export function Area({
  width,
  height,
  color,
  children,
  className,
  style,
  ref,
  ...props
}: XYPadAreaProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadAreaProps>) {
  const { areaRef } = useXYPadContext()

  // The area is what the pointer position is normalized against, so the
  // context ref is composed with any ref the caller passed.
  const composedRef = useComposedRefs<HTMLDivElement>(ref, areaRef)

  return (
    <div
      ref={composedRef}
      className={cx('tremolo-xy-pad-area', className)}
      style={
        {
          '--color': color,
          '--width': cssLength(width),
          '--height': cssLength(height),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <Placement name="XYPad.Area">{children}</Placement>
    </div>
  )
}
