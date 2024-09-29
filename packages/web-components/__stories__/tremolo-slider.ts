import { Args } from '@storybook/html'
import {
  Direction,
  ScaleType,
  ScaleOrderList,
  ScaleOption,
} from 'common/components/Slider/type'
import { WheelOption } from 'common/types'

export interface SliderProps {
  value: number

  min: number
  max: number

  // optional
  step?: number
  skew?: number // | SkewFunction
  length?: number | string
  thickness?: number | string
  direction?: Direction
  scale?: ['step', ScaleType] | [number, ScaleType] | ScaleOrderList[]
  scaleOption?: ScaleOption
  color?: string
  bg?: string
  bodyNoSelect?: boolean
  enableWheel?: WheelOption
  className?: string
  style?: string
  onChange?: (value: number) => void
  children?: string
}

export function convertString(obj: string | number | boolean | object) {
  if (typeof obj == 'string') {
    return obj
  } else if (typeof obj == 'number' || typeof obj == 'boolean') {
    return String(obj)
  } else if (typeof obj == 'object') {
    console.log('conv', obj, JSON.stringify(obj))
    return JSON.stringify(obj)
  } else {
    throw Error('unknown type')
  }
}

export const createSliderHTML = ({ ...props }) => {
  const slider = document.createElement('tremolo-slider')
  for (const [k, v] of Object.entries(props)) {
    console.log('adapt: ', k, v)
    if (k == 'children') {
      slider.append(String(v))
    } else if (typeof v != 'function') {
      slider.setAttribute(k, convertString(v))
    } else if (k == 'onChange') {
      slider.onChange = v
    }
  }
  return slider
}

export function createSlider({ children, ...props }: Args) {
  let p = ''
  for (const [k, v] of Object.entries(props)) {
    p += ` ${k}='${convertString(v)}'`
  }
  const c = children ? String(children) : ''
  return '<tremolo-slider' + p + '>' + c + '</tremolo-slider>'
}
