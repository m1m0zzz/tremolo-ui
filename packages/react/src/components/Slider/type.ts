import { CSSObject } from '@emotion/react'

import type { ScaleOption as Opt } from '@tremolo-ui/functions/components/Slider/type'

export type ScaleOption = Opt & {
  style?: CSSObject
}
