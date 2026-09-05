import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, useCallback } from 'react'

import { toFixed, xor } from '@tremolo-ui/functions'

import { useCheckPlacement } from '../_util/placement'

import { useSliderContext } from './context'
import { MarksType } from './type'

export interface MarksOptionProps {
  // required
  value: number

  // optional
  type?: MarksType
  /** Display text instead of value. */
  label?: string
  /** mark thickness */
  thickness?: number | string
  /** mark length */
  length?: number | string
  /** Gap between mark and label. */
  gap?: number | string
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
  type = 'mark-number',
  label,
  thickness = 1,
  length = '0.5rem',
  gap = 2,
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
      className={clsx('tremolo-slider-marks-option', className)}
      style={{
        left: !vertical ? `${calcPercent(value)}%` : undefined,
        top: vertical ? `${calcPercent(value)}%` : undefined,
        ...style,
      }}
      data-vertical={vertical}
      {...props}
    >
      {type !== 'number' && (
        <div
          className={clsx('tremolo-slider-marks-option-mark', classes?.mark)}
          style={{
            width: !vertical ? thickness : length,
            height: vertical ? thickness : length,
            marginBottom: !vertical ? gap : undefined,
            marginRight: vertical ? gap : undefined,
            ...styles?.mark,
          }}
          data-vertical={vertical}
        ></div>
      )}
      {type !== 'mark' && (
        <div
          className={clsx('tremolo-slider-marks-option-label', classes?.label)}
          style={{
            width: labelWidth,
            ...styles?.label,
          }}
        >
          {label || value}
        </div>
      )}
    </div>
  )
}
