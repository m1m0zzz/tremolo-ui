import { decimalPart, toFixed } from '@tremolo-ui/functions'

export type MarksType = 'mark' | 'mark-number' | 'number'
export type MarksOptions = ['step', MarksType] | [number, MarksType]

export function generateOptionsList(
  options: MarksOptions,
  min: number,
  max: number,
  step: number,
) {
  const optionsList: {
    value: number
    type: MarksType
  }[] = []
  const per = options[0] === 'step' ? step : options[0]
  const count = Math.floor(max / per) - Math.ceil(min / per) + 1
  for (let i = 0; i < count; i++) {
    const value = toFixed(
      per * (Math.ceil(min / per) + i),
      decimalPart(per)?.length,
    )
    optionsList.push({ value: value, type: options[1] })
  }
  return optionsList
}
