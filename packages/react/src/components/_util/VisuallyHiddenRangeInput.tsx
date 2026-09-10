import { ComponentPropsWithoutRef, CSSProperties, forwardRef } from 'react'

const hiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
  pointerEvents: 'none',
}

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'style'>

export const VisuallyHiddenRangeInput = /* @__PURE__ */ forwardRef<
  HTMLInputElement,
  Props
>((props, ref) => (
  <input {...props} ref={ref} type="range" style={hiddenStyle} />
))
