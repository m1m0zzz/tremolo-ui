import clsx from 'clsx'
import { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

import { usePianoContext } from './context'

import { getNoteRangeArray } from '.'

/** @category Piano */
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
  __label?: (note: number, index: number) => ReactNode
}

/** @category Piano */
export function KeyLabel({
  label,
  className,
  wrapperClassName,
  wrapperStyle,
  __note,
  __label,
  ...props
}: KeyLabelProps & Omit<ComponentPropsWithoutRef<'div'>, keyof KeyLabelProps>) {
  const noteRange = usePianoContext((s) => s.noteRange)
  const noteRangeArray = getNoteRangeArray(noteRange)
  const index = noteRangeArray.indexOf(__note!)
  const content = label
    ? label(__note!, index)
    : __label && __label(__note!, index)

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
