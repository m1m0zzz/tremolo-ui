import { decimalPart, toFixed } from '@tremolo-ui/functions'

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

export function generateOptionsList(
  options: MarksOptions,
  min: number,
  max: number,
  step: number,
) {
  const {
    per,
    mark = true,
    label = true,
  } = typeof options === 'object' ? options : { per: options }
  const optionsList: {
    value: number
    mark: boolean
    label: boolean
  }[] = []
  const interval = per === 'step' ? step : per
  const count = Math.floor(max / interval) - Math.ceil(min / interval) + 1
  for (let i = 0; i < count; i++) {
    const value = toFixed(
      interval * (Math.ceil(min / interval) + i),
      decimalPart(interval)?.length,
    )
    optionsList.push({ value: value, mark: mark, label: label })
  }
  return optionsList
}
