import { CSSObject, css } from '@emotion/react'
import { forwardRef, ReactNode, useImperativeHandle, useRef } from 'react'

interface SliderThumbProps {
  size?: number | string
  width?: number | string
  height?: number | string
  color?: string
  hoverColor?: string
  zIndex?: number
  style?: CSSObject
  __css?: CSSObject
  // __inheritColor?: string
  children?: ReactNode
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
  zIndex = 100,
  children,
  style,
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
      {/* TODO: add ref object */}
      {children ? (
        children
      ) : (
        // default slider thumb
        <div
          ref={wrapperRef}
          className="tremolo-slider-thumb"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          css={css({
            background: color,
            width: size ?? width,
            height: size ?? height,
            borderRadius: '50%',
            outline: 'none',
            '&:hover': {
              background: hoverColor
            },
            '&:focus': {
              boxShadow: '0px 0px 0px 3px rgba(var(--tremolo-theme-color-rgb), 0.2)',
            },
            ...style,
          })}
        ></div>
      )}
    </div>
  )
})
