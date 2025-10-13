import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, useCallback } from 'react'

import { toFixed, xor, normalizeValue } from '@tremolo-ui/functions'

import { useSliderContext } from './context'
import { ScaleType } from './type'

/** @category Slider */
export interface ScaleOptionProps {
  // required
  value: number

  // optional
  type?: ScaleType
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

/** @category Slider */
export function ScaleOption({
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
}: ScaleOptionProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof ScaleOptionProps>) {
  const min = useSliderContext((s) => s.min)
  const max = useSliderContext((s) => s.max)
  const skew = useSliderContext((s) => s.skew)
  const vertical = useSliderContext((s) => s.vertical)
  const reverse = useSliderContext((s) => s.reverse)

  const calcPercent = useCallback(
    (rawValue: number) => {
      return toFixed(
        xor(vertical, reverse)
          ? 100 - normalizeValue(rawValue, min, max, skew) * 100
          : normalizeValue(rawValue, min, max, skew) * 100,
      )
    },
    [vertical, reverse, max, min, skew],
  )

  return (
    <div
      className={clsx('tremolo-slider-scale-option', className)}
      style={{
        left: !vertical ? `${calcPercent(value)}%` : undefined,
        top: vertical ? `${calcPercent(value)}%` : undefined,
        ...style,
      }}
      data-vertical={vertical}
      {...props}
    >
      {type != 'number' && (
        <div
          className={clsx('tremolo-slider-scale-option-mark', classes?.mark)}
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
      {type != 'mark' && (
        <div
          className={clsx('tremolo-slider-scale-option-label', classes?.label)}
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
