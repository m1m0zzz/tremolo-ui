import clsx from "clsx"
import { CSSProperties, ReactNode } from "react"

export interface KeyLabelProps {
  /**
   * override Piano.label
   */
  label?: (note: number, index: number) => ReactNode

  className?: string
  style?: CSSProperties
  wrapperStyle?: CSSProperties

  /** @internal */
  __note?: number
  /** @internal */
  __index?: number
  /** @internal */
  __label?: (note: number, index: number) => ReactNode
}

export function KeyLabel({
  label,
  className,
  style,
  wrapperStyle,
  __note,
  __index,
  __label,
}: KeyLabelProps) {
  const content = label ? label(__note!, __index!) : __label && __label(__note!, __index!)

  return (
    (content != undefined || content != null) &&
    <div
      className='tremolo-piano-key-label-wrapper'
      style={wrapperStyle}
    >
      <div
        className={clsx('tremolo-piano-key-label', className)}
        style={style}
      >
        {content}
      </div>
    </div>
  )
}
