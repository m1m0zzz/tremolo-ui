import { CSSObject } from '@emotion/react'

import type { ScaleOption as Opt } from '@tremolo-ui/functions/components/Slider/type'

export type ScaleOption = Opt & {
  style?: CSSObject
}

export {
  type Direction,
  type Horizontal,
  type ScaleOrderList,
  type ScaleType,
  type Vertical,
  gradientDirection
} from '@tremolo-ui/functions/components/Slider/type'
