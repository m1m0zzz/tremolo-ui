import { ComponentPropsWithoutRef, CSSProperties } from 'react'

import { cssLength, type MarksOptions, sliderMarks } from '@tremolo-ui/dom'

import { Placement } from '../_util/Placement'

import { useSliderContext } from './context'
import { MarksOption } from './MarksOption'

import type { CSSVariables } from '../../css-variables'

export interface SliderMarksProps {
  /**
   * Space between the marks and the track. Sets `--gap`; the theme's own
   * spacing stands when this is omitted.
   */
  gap?: number | string
  /**
   * Build the marks instead of writing `Slider.MarksOption` out: a number puts
   * one every that many, `'step'` one every `step`, and `{ per, mark, label }`
   * also turns the mark or the label off for all of them. `children` is
   * ignored while it is set.
   *
   * `'step'` makes one per step, which is a great many for a fine `step`.
   */
  options?: MarksOptions

  style?: CSSProperties & CSSVariables<'gap'>
}

export function Marks({
  gap,
  options,
  children,
  className,
  style,
  ...props
}: SliderMarksProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SliderMarksProps>) {
  const min = useSliderContext((s) => s.min)
  const max = useSliderContext((s) => s.max)
  const step = useSliderContext((s) => s.step)
  const vertical = useSliderContext((s) => s.vertical)
  const reverse = useSliderContext((s) => s.reverse)

  const optionsList = options ? sliderMarks(options, min, max, step) : []
  if (vertical !== reverse) optionsList.reverse()

  return (
    <div
      className={className}
      data-orientation={vertical ? 'vertical' : 'horizontal'}
      style={
        {
          '--gap': cssLength(gap),
          // Each option inside is placed against this box.
          position: 'relative',
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <Placement name="Slider.Marks">
        {options
          ? optionsList.map(({ value, mark, label }, index) => {
              return (
                <MarksOption
                  key={index}
                  value={value}
                  mark={mark}
                  label={label ? undefined : null}
                />
              )
            })
          : children}
      </Placement>
    </div>
  )
}
