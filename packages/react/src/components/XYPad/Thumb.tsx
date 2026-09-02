import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  Ref,
  useImperativeHandle,
  useRef,
} from 'react'

import { useXYPadContext } from './context'

export interface XYPadThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string

  color?: string

  wrapperClassName?: string
  wrapperStyle?: CSSProperties

  children?: ReactNode
  ref?: Ref<XYPadThumbMethods>
}

export interface XYPadThumbMethods {
  focus: () => void
  blur: () => void
}

type Props = XYPadThumbProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof XYPadThumbProps>

export function Thumb({
  size,
  width,
  height,
  color,
  children,
  wrapperClassName,
  wrapperStyle,
  className,
  style,
  ref,
  ...props
}: Props) {
  const elementRef = useRef<HTMLDivElement>(null)
  const { disabled, readonly, percent, thumbRef } = useXYPadContext()

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
      className={clsx('tremolo-xy-pad-thumb-wrapper', wrapperClassName)}
      style={{
        left: `${percent[0]}%`,
        top: `${percent[1]}%`,
        ...wrapperStyle,
      }}
      {...props}
    >
      {children ? (
        children
      ) : (
        // default thumb
        <div
          ref={elementRef}
          className={clsx('tremolo-xy-pad-thumb', className)}
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
