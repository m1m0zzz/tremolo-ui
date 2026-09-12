import { ComponentPropsWithoutRef, CSSProperties, useCallback } from 'react'

import { toFixed, xor } from '@tremolo-ui/functions'

import { cssLength } from '../_util/css-length'
import { cx } from '../_util/cx'
import { useCheckPlacement } from '../_util/Placement'

import { useSliderContext } from './context'

export interface MarksOptionProps {
  // required
  value: number

  // optional
  /** Whether to draw the mark itself. */
  mark?: boolean
  /**
   * Text shown in place of the value. `null` leaves the label out; an empty
   * string draws an empty label.
   */
  label?: number | string | null
  /** Mark thickness. Sets `--thickness`. */
  thickness?: number | string
  /** Mark length. Sets `--length`. */
  length?: number | string
  /** Gap between mark and label. Sets `--gap`. */
  gap?: number | string
  /** Sets `--label-width`. */
  labelWidth?: number | string
  classes?: {
    mark?: string
    label?: string
  }
  styles?: {
    mark?: CSSProperties
    label?: CSSProperties
  }
}

export function MarksOption({
  value,
  mark = true,
  label,
  thickness,
  length,
  gap,
  labelWidth,
  classes,
  styles,
  className,
  style,
  ...props
}: MarksOptionProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof MarksOptionProps>) {
  useCheckPlacement('Slider.MarksOption', 'Slider.Marks')

  const min = useSliderContext((s) => s.min)
  const max = useSliderContext((s) => s.max)
  const scale = useSliderContext((s) => s.scale)
  const vertical = useSliderContext((s) => s.vertical)
  const reverse = useSliderContext((s) => s.reverse)

  const calcPercent = useCallback(
    (value: number) => {
      // The marks have to sit on the same curve the thumb runs along.
      const percent = scale.normalize(value, min, max) * 100
      return toFixed(xor(vertical, reverse) ? 100 - percent : percent)
    },
    [vertical, reverse, max, min, scale],
  )

  return (
    <div
      className={cx('tremolo-slider-marks-option', className)}
      style={
        {
          // The mark and the label read these, so they are set once here.
          '--thickness': cssLength(thickness),
          '--length': cssLength(length),
          '--gap': cssLength(gap),
          '--label-width': cssLength(labelWidth),
          // Where the mark belongs on the track: the value, not a style.
          left: !vertical ? `${calcPercent(value)}%` : undefined,
          top: vertical ? `${calcPercent(value)}%` : undefined,
          ...style,
        } as CSSProperties
      }
      data-vertical={vertical}
      {...props}
    >
      {mark && (
        <div
          className={cx('tremolo-slider-marks-option-mark', classes?.mark)}
          style={styles?.mark}
          data-vertical={vertical}
        ></div>
      )}
      {label !== null && (
        <div
          className={cx('tremolo-slider-marks-option-label', classes?.label)}
          style={styles?.label}
        >
          {label ?? value}
        </div>
      )}
    </div>
  )
}
