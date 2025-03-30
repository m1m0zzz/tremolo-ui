import clsx from 'clsx'
import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
} from 'react'

import { useSliderContext } from './context'

/** @category Slider */
export interface SliderThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string

  color?: string

  className?: string
  style?: CSSProperties
  children?: ReactNode

  /** @internal */
  __percent?: number
}

/** @category Slider */
export interface SliderThumbMethods {
  focus: () => void
  blur: () => void
}

/** @category Slider */
export const defaultThumbSize = 22

/** @category Slider */
export const SliderThumb = forwardRef<SliderThumbMethods, SliderThumbProps>(
  (
    {
      size,
      width = defaultThumbSize,
      height = defaultThumbSize,
      color,
      children,
      className,
      style,
      __percent,
    }: SliderThumbProps,
    ref,
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const vertical = useSliderContext((s) => s.vertical)
    const disabled = useSliderContext((s) => s.disabled)
    const readonly = useSliderContext((s) => s.readonly)

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
            aria-readonly={readonly}
            style={{
              ...{ '--color': color },
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
