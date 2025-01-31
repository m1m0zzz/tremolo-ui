import { CSSObject, css } from '@emotion/react'
import { forwardRef, ReactNode, useImperativeHandle, useRef } from 'react'
import clsx from 'clsx'

export interface SliderThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string
  color?: string
  hoverColor?: string
  disabledColor?: string
  disabledHoverColor?: string
  zIndex?: number

  className?: string
  style?: CSSObject
  children?: ReactNode

  /** @internal */
  __disabled?: boolean
  /** @internal */
  __css?: CSSObject
}

export interface SliderThumbMethods {
  focus: () => void
  blur: () => void
}

 export const SliderThumb = forwardRef<SliderThumbMethods, SliderThumbProps>(({
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
}: SliderThumbProps, ref) => {
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
      className="tremolo-slider-thumb-wrapper"
      css={css({
        position: 'absolute',
        translate: '-50% -50%',
        zIndex: zIndex,
        ...__css,
      })}
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
          css={css({
            background: __disabled ? disabledColor : color,
            width: size ?? width,
            height: size ?? height,
            borderRadius: '50%',
            outline: 'none',
            '&:hover': {
              background: __disabled ? disabledHoverColor : hoverColor
            },
            '&:focus': !__disabled && {
              boxShadow: '0px 0px 0px 3px rgba(var(--tremolo-theme-color-rgb), 0.2)',
            },
            ...style,
          })}
        ></div>
      )}
    </div>
  )
})
