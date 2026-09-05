import clsx from 'clsx'
import {
  CSSProperties,
  ReactNode,
  Ref,
  useImperativeHandle,
  useRef,
} from 'react'

import { useCheckPlacement } from '../_util/placement'

import { useSliderContext } from './context'

export interface SliderThumbProps {
  /**
   * Size comes from the `--thumb-size` CSS variable on `Slider.Root`, so that
   * the root can reserve the matching amount of space around the track.
   */
  color?: string

  className?: string
  style?: CSSProperties
  children?: ReactNode
  ref?: Ref<SliderThumbMethods>
}

export interface SliderThumbMethods {
  focus: () => void
  blur: () => void
}

export function Thumb({
  color,
  children,
  className,
  style,
  ref,
}: SliderThumbProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const { vertical, disabled, readonly, percent, thumbRef } = useSliderContext()

  // The wrapper is positioned against the track.
  useCheckPlacement('Slider.Thumb', 'Slider.Track')

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
      className="tremolo-slider-thumb-wrapper"
      style={{
        top: vertical ? `${percent}%` : '50%',
        left: !vertical ? `${percent}%` : '50%',
      }}
    >
      {children ? (
        children
      ) : (
        // default slider thumb
        <div
          ref={elementRef}
          className={clsx('tremolo-slider-thumb', className)}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          aria-disabled={disabled}
          aria-readonly={readonly}
          style={{
            ...{ '--color': color },
            ...style,
          }}
        ></div>
      )}
    </div>
  )
}
