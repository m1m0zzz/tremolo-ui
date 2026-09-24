import { ComponentPropsWithoutRef, CSSProperties, forwardRef } from 'react'

import { useComposedRefs } from '../../compose-refs'
import { Placement } from '../_util/Placement'

import { useXYPadContext } from './context'

export const Area = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(function Area({ children, className, style, ...props }, forwardedRef) {
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
})
