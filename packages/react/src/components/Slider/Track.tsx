import { css, CSSObject } from '@emotion/react'
import { ReactElement } from 'react'

interface SliderTrackProps {
  style?: CSSObject
  children?: ReactElement
  __css?: CSSObject
}

export function SliderTrack({
  children,
  style,
  __css,
}: SliderTrackProps) {
  return (
    <div className="tremolo-slider-track" css={css({ ...__css, ...style })}>
      {children}
    </div>
  )
}
