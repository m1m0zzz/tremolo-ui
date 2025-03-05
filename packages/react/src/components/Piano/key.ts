import { CSSProperties, ReactElement, ReactNode } from 'react'

/**
 * @category Piano
 */
export interface KeyProps {
  width?: number
  height?: number | `${number}%`

  style?: CSSProperties

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
  __onPlayNote?: (noteNumber: number) => void
  /** @internal */
  __onStopNote?: (noteNumber: number) => void
  /** @internal */
  __label?: (note: number, index: number) => ReactNode
}

/**
 * @category Piano
 */
export interface KeyMethods {
  play: () => void
  stop: () => void
  played: () => boolean
}
