import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
} from 'react'

/** @category XYPad */
export interface ThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string

  wrapperClassName?: string
  wrapperStyle?: CSSProperties

  children?: ReactNode

  /** @internal */
  __disabled?: boolean
  /** @internal */
  __css?: CSSProperties
}

/** @category XYPad */
export interface XYPadThumbMethods {
  focus: () => void
  blur: () => void
}

type Props = ThumbProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof ThumbProps>

/** @category XYPad */
export const XYPadThumb = forwardRef<XYPadThumbMethods, Props>(
  (
    {
      size,
      width = 22,
      height = 22,
      children,
      wrapperClassName,
      wrapperStyle,
      className,
      style,
      __disabled,
      __css,
      ...props
    }: Props,
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
        className={clsx('tremolo-xy-pad-thumb-wrapper', wrapperClassName)}
        style={{
          ...__css,
          ...wrapperStyle,
        }}
        {...props}
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
