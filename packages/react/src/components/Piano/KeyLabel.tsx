import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

export interface KeyLabelProps {
  /**
   * override Piano.label
   */
  label?: (note: number, index: number) => ReactNode

  wrapperClassName?: string
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
  wrapperClassName,
  wrapperStyle,
  __note,
  __index,
  __label,
  ...props
}: KeyLabelProps & Omit<ComponentPropsWithoutRef<'div'>, keyof KeyLabelProps>) {
  const content = label
    ? label(__note!, __index!)
    : __label && __label(__note!, __index!)

  return (
    (content != undefined || content != null) && (
      <div
        className={clsx('tremolo-piano-key-label-wrapper', wrapperClassName)}
        style={wrapperStyle}
      >
        <div className={clsx('tremolo-piano-key-label', className)} {...props}>
          {content}
        </div>
      </div>
    )
  )
}
