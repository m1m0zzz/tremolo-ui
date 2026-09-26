import { ComponentPropsWithoutRef, forwardRef } from 'react'

import { visuallyHiddenStyle } from '@tremolo-ui/dom'

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'style'>

export const VisuallyHiddenRangeInput = /* @__PURE__ */ forwardRef<
  HTMLInputElement,
  Props
>((props, ref) => (
  <input {...props} ref={ref} type="range" style={visuallyHiddenStyle} />
))
