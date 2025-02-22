import clsx from 'clsx'
import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
} from 'react'

import { useDisabled, useVertical } from './context'

export interface SliderThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string

  className?: string
  style?: CSSProperties
  children?: ReactNode

  /** @internal */
  __percent?: number
}

export interface SliderThumbMethods {
  focus: () => void
  blur: () => void
}

export const defaultThumbSize = 22

export const SliderThumb = forwardRef<SliderThumbMethods, SliderThumbProps>(
  (
    {
      size,
      width = defaultThumbSize,
      height = defaultThumbSize,
      children,
      className,
      style,
      __percent,
    }: SliderThumbProps,
    ref,
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const vertical = useVertical()
    const disabled = useDisabled()

    useImperativeHandle(ref, () => {
      return {
        focus() {
          wrapperRef.current?.focus()
        },
        blur() {
          wrapperRef.current?.blur()
        },
      }
    }, [])

    return (
      <div
        className="tremolo-slider-thumb-wrapper"
        style={{
          top: vertical ? `${__percent}%` : '50%',
          left: !vertical ? `${__percent}%` : '50%',
        }}
      >
        {children ? (
          children
        ) : (
          // default slider thumb
          <div
            ref={wrapperRef}
            className={clsx('tremolo-slider-thumb', className)}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            aria-disabled={disabled}
            style={{
              width: size ?? width,
              height: size ?? height,
              ...style,
            }}
          ></div>
        )}
      </div>
    )
  },
)
