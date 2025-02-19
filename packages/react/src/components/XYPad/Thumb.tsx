import clsx from 'clsx'
import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
} from 'react'

export interface ThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string
  color?: string
  hoverColor?: string
  disabledColor?: string
  disabledHoverColor?: string
  zIndex?: number

  className?: string
  style?: CSSProperties
  children?: ReactNode

  /** @internal */
  __disabled?: boolean
  /** @internal */
  __css?: CSSProperties
}

export interface XYPadThumbMethods {
  focus: () => void
  blur: () => void
}

export const XYPadThumb = forwardRef<XYPadThumbMethods, ThumbProps>(
  (
    {
      size,
      width = 22,
      height = 22,
      color = '#4e76e6',
      hoverColor = color,
      disabledColor = '#5d6478',
      disabledHoverColor = disabledColor,
      zIndex = 100,
      children,
      className,
      style,
      __disabled,
      __css,
    }: ThumbProps,
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
      <div
        className="tremolo-xy-pad-thumb-wrapper"
        style={{
          position: 'absolute',
          translate: '-50% -50%',
          zIndex: zIndex,
          ...__css,
        }}
      >
        {children ? (
          children
        ) : (
          // default thumb
          <div
            ref={wrapperRef}
            className={clsx('tremolo-xy-pad-thumb', className)}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            style={{
              background: __disabled ? disabledColor : color,
              width: size ?? width,
              height: size ?? height,
              borderRadius: '50%',
              outline: 'none',
              // '&:hover': {
              //   background: __disabled ? disabledHoverColor : hoverColor
              // },
              // '&:focus': !__disabled && {
              //   boxShadow: '0px 0px 0px 3px rgba(var(--tremolo-theme-color-rgb), 0.2)',
              // },
              ...style,
            }}
          ></div>
        )}
      </div>
    )
  },
)
