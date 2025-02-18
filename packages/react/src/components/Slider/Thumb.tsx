import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
} from 'react'
import clsx from 'clsx'

export interface SliderThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string

  className?: string
  style?: CSSProperties
  children?: ReactNode

  /** @internal */
  __disabled?: boolean
  /** @internal */
  __css?: CSSProperties
}

export interface SliderThumbMethods {
  focus: () => void
  blur: () => void
}

export const SliderThumb = forwardRef<SliderThumbMethods, SliderThumbProps>(
  (
    {
      size,
      width = 22,
      height = 22,
      children,
      className,
      style,
      __disabled,
      __css,
    }: SliderThumbProps,
    ref,
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null)

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
      <div className="tremolo-slider-thumb-wrapper" style={__css}>
        {children ? (
          children
        ) : (
          // default slider thumb
          <div
            ref={wrapperRef}
            className={clsx('tremolo-slider-thumb', className)}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            aria-disabled={__disabled}
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
