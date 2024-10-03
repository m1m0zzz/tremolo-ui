import { CSSObject } from '@emotion/react'

import type { ScaleOption as Opt } from 'common/components/Slider/type'

export type ScaleOption = Opt & {
  style?: CSSObject
}
