import { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

import { cssLength } from '../_util/css-length'
import { Placement } from '../_util/Placement'
import { xor } from '../_util/xor'

import { useSliderContext } from './context'
import { MarksOption } from './MarksOption'
import { generateOptionsList, MarksOptions } from './type'

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
  /**
   * `<Slider.MarksOption />` goes here, one per mark. Ignored while `options`
   * is set.
   */
  children?: ReactNode
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

  const optionsList = options
    ? generateOptionsList(options, min, max, step)
    : []
  if (xor(vertical, reverse)) optionsList.reverse()

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
