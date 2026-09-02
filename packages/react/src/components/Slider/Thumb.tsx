import clsx from 'clsx'
import {
  CSSProperties,
  ReactNode,
  Ref,
  useImperativeHandle,
  useRef,
} from 'react'

import { useSliderContext } from './context'

export interface SliderThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string

  color?: string

  className?: string
  style?: CSSProperties
  children?: ReactNode
  ref?: Ref<SliderThumbMethods>
}

export interface SliderThumbMethods {
  focus: () => void
  blur: () => void
}

export const defaultThumbSize = 22

export function Thumb({
  size,
  width,
  height,
  color,
  children,
  className,
  style,
  ref,
}: SliderThumbProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const { vertical, disabled, readonly, percent, thumbRef } = useSliderContext()

  const methods = () => ({
    focus() {
      elementRef.current?.focus()
    },
    blur() {
      elementRef.current?.blur()
    },
  })

  useImperativeHandle(ref, methods, [])
  // Root focuses the thumb when a drag starts, wherever the user placed it.

  useImperativeHandle(thumbRef, methods, [])

  return (
    <div
      className="tremolo-slider-thumb-wrapper"
      style={{
        top: vertical ? `${percent}%` : '50%',
        left: !vertical ? `${percent}%` : '50%',
      }}
    >
      {children ? (
        children
      ) : (
        // default slider thumb
        <div
          ref={elementRef}
          className={clsx('tremolo-slider-thumb', className)}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          aria-disabled={disabled}
          aria-readonly={readonly}
          style={{
            ...{ '--color': color },
            // Falls back to --thumb-size from the CSS
            width: size ?? width,
            height: size ?? height,
            ...style,
          }}
        ></div>
      )}
    </div>
  )
}
