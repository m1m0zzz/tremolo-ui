import { ComponentPropsWithoutRef, CSSProperties } from 'react'

import { cssLength, valuePercent } from '@tremolo-ui/dom'

import { useCheckPlacement } from '../_util/Placement'

import { useSliderContext } from './context'

import type { CSSVariables } from '../../css-variables'

export interface SliderMarksOptionProps {
  /** Where the mark sits, on the same scale as the thumb. */
  value: number

  /**
   * Draw the mark itself. Turn it off to show the label alone.
   * @default true
   */
  mark?: boolean
  /**
   * Text shown next to the mark. Leave it out to show the value; `null` leaves
   * the label out, and an empty string draws an empty one.
   */
  label?: number | string | null
  /** Thickness of the mark. Sets `--thickness`. */
  thickness?: number | string
  /** Length of the mark. Sets `--length`. */
  length?: number | string
  /** Space between the mark and the label. Sets `--gap`. */
  gap?: number | string
  /** Classes for the mark and the label inside the option. */
  classes?: {
    mark?: string
    label?: string
  }
  /** Styles for the mark and the label inside the option. */
  styles?: {
    mark?: CSSProperties
    label?: CSSProperties
  }

  style?: CSSProperties &
    CSSVariables<'thickness' | 'length' | 'gap' | 'translate'>
}

export function MarksOption({
  value,
  mark = true,
  label,
  thickness,
  length,
  gap,
  classes,
  styles,
  className,
  style,
  ...props
}: SliderMarksOptionProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderMarksOptionProps>) {
  useCheckPlacement('Slider.MarksOption', 'Slider.Marks')

  const min = useSliderContext((s) => s.min)
  const max = useSliderContext((s) => s.max)
  const scale = useSliderContext((s) => s.scale)
  const vertical = useSliderContext((s) => s.vertical)
  const reverse = useSliderContext((s) => s.reverse)

  // The marks have to sit on the same curve the thumb runs along.
  const percent = valuePercent(value, { min, max, scale }, vertical !== reverse)

  return (
    <div
      className={className}
      style={
        {
          // The mark and the label read these, so they are set once here.
          '--thickness': cssLength(thickness),
          '--length': cssLength(length),
          '--gap': cssLength(gap),
          // The mechanics of the position below, as on the thumb.
          position: 'absolute',
          translate: vertical
            ? 'var(--translate, 0 -50%)'
            : 'var(--translate, -50% 0)',
          zIndex: 10,
          ...style,
          // Where the mark belongs on the track: the value, not a style.
          left: !vertical ? `${percent}%` : undefined,
          top: vertical ? `${percent}%` : undefined,
        } as CSSProperties
      }
      data-orientation={vertical ? 'vertical' : 'horizontal'}
      {...props}
    >
      {mark && (
        <div
          className={classes?.mark}
          style={styles?.mark}
          data-orientation={vertical ? 'vertical' : 'horizontal'}
        ></div>
      )}
      {label !== null && (
        <div className={classes?.label} style={styles?.label}>
          {label ?? value}
        </div>
      )}
    </div>
  )
}
