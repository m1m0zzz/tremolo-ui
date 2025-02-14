import type { ScaleOption as Opt } from '@tremolo-ui/functions/Slider'
import { CSSProperties } from 'react'

export type ScaleOption = Opt & {
  style?: CSSProperties
}

export {
  type ScaleOrderList,
  type ScaleType,
} from '@tremolo-ui/functions/Slider'
