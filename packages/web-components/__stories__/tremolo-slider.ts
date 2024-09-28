/* eslint-disable @typescript-eslint/no-unused-vars */
import { SliderProps } from '../src/components/tremolo-slider'

export const createSlider = ({ ...props }: SliderProps) => {
  const slider = document.createElement('tremolo-slider')

  for (const [k, v] of Object.entries(props)) {
    console.log('adapt: ', k, v)
    if (k == 'children') {
      slider.append(v)
    } else if (typeof v != 'function') {
      slider[k] = v
    } else if (k == 'onChange') {
      slider.onChange = v
    }
  }

  return slider
}
