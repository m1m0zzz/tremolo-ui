import { CSSObject } from "@emotion/react"
import { ReactElement, ReactNode } from "react"

export interface KeyProps {
  width?: number
  height?: number | string

  bg?: string
  activeBg?: string
  style?: CSSObject

  /**
   * \<KeyLabel />
   */
  children?: ReactElement

  /** @internal */
  __glissando?: boolean
  /** @internal */
  __position?: number
  /** @internal */
  __note?: number
  /** @internal */
  __disabled?: boolean
  /** @internal */
  __index?: number
  /** @internal */
  __fill?: boolean
  /** @internal */
  __width?: number
  /** @internal */
  __playNote?: (noteNumber: number) => void
  /** @internal */
  __stopNote?: (noteNumber: number) => void
  /** @internal */
  __label?: (note: number) => ReactNode
}

export interface KeyMethods {
  play: () => void
  stop: () => void
  played: () => boolean
}
