import { toFixed } from '@tremolo-ui/functions'

import { decimalDigits } from './decimal-digits'

/**
 * How `Slider.Marks` fills itself in when it is given no children: one option
 * every `per`, or every `step` of the slider. The object form turns off the
 * mark or the label for the whole set; a single option is customized by
 * writing `Slider.MarksOption` out instead.
 */
export type MarksOptions =
  | 'step'
  | number
  | {
      per: 'step' | number
      mark?: boolean
      label?: boolean
    }

/** One mark along a slider, as {@link sliderMarks} lays them out. */
export interface SliderMark {
  value: number
  mark: boolean
  label: boolean
}

/**
 * The marks `options` asks for between `min` and `max`, in ascending order.
 *
 * Each value is a whole multiple of the interval, rounded to the digits the
 * interval has: stepping by 0.1 would otherwise put binary debris in the
 * labels (`0.1 * 3` is `0.30000000000000004`).
 */
export function sliderMarks(
  options: MarksOptions,
  min: number,
  max: number,
  step: number,
): SliderMark[] {
  const {
    per,
    mark = true,
    label = true,
  } = typeof options === 'object' ? options : { per: options }
  const optionsList: SliderMark[] = []
  const interval = per === 'step' ? step : per
  const count = Math.floor(max / interval) - Math.ceil(min / interval) + 1
  for (let i = 0; i < count; i++) {
    const value = toFixed(
      interval * (Math.ceil(min / interval) + i),
      decimalDigits(interval),
    )
    optionsList.push({ value: value, mark: mark, label: label })
  }
  return optionsList
}
