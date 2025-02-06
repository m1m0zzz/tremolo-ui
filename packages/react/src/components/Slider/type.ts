import { CSSObject } from '@emotion/react'

import type { ScaleOption as Opt } from '@tremolo-ui/functions/Slider'

export type ScaleOption = Opt & {
  style?: CSSObject
}

export {
  type ScaleOrderList,
  type ScaleType,
} from '@tremolo-ui/functions/Slider'
