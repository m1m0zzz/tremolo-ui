import { CSSObject, css } from '@emotion/react'
import { ReactNode, ReactElement } from 'react'

interface SliderThumbProps {
  color?: string
  style?: CSSObject
  __css?: CSSObject
  children?: ReactNode
}

export function SliderThumb({
  color,
  children,
  style,
  __css,
}: SliderThumbProps): ReactElement {
  return (
    <div
      className="tremolo-slider-thumb-wrapper"
      css={css({
        width: 'fit-content',
        height: 'fit-content',
        position: 'absolute',
        translate: '-50% -50%',
        zIndex: 100,
        ...__css,
      })}
    >
      {children ? (
        children
      ) : (
        // default slider thumb
        <div
          className="tremolo-slider-thumb"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          css={css({
            background: color,
            width: '1.4rem',
            height: '1.4rem',
            borderRadius: '50%',
            ...style,
          })}
        ></div>
      )}
    </div>
  )
}
