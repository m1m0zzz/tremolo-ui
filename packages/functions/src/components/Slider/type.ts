/**
 * @module Slider
*/

import { decimalPart, toFixed } from '../../math'

// export type SkewFunction = (x: number) => number

export type ScaleType = 'mark' | 'mark-number' | 'number'
export type ScaleOrderList = {
  at: number
  type?: ScaleType
  text?: string
  style?: {
    markColor?: string
    labelColor?: string
    length?: number | string
    thickness?: number | string
  }
}

export function parseScaleOrderList(
  scale:
    | ['step', ScaleType]
    | [number, ScaleType]
    | ScaleOrderList[]
    | undefined,
  min: number,
  max: number,
  step: number,
) {
  let scalesList: ScaleOrderList[] = []
  if (!scale) {
    // return empty array
  } else if (typeof scale[0] == 'object') {
    scalesList = scale
  } else {
    const per = scale[0] == 'step' ? step : scale[0]
    const count = Math.floor(max / per) - Math.ceil(min / per) + 1
    for (let i = 0; i < count; i++) {
      const at = toFixed(
        per * (Math.ceil(min / per) + i),
        decimalPart(per)?.length,
      )
      scalesList.push({ at: at, type: scale[1] })
    }
  }
  return scalesList
}

export type ScaleOption = {
  /**
   * @default 'mark-number'
   */
  defaultType?: ScaleType
  markColor?: string
  labelColor?: string
  gap?: number | string
  labelWidth?: number | string
  style?: unknown
}
