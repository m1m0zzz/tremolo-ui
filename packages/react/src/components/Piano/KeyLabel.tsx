import { css, CSSObject } from "@emotion/react"
import clsx from "clsx"
import { ReactNode } from "react"

interface Props {
  /**
   * override Piano.label
   */
  label?: (note: number, index: number) => ReactNode

  className?: string
  style?: CSSObject
  wrapperStyle?: CSSObject

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
}: Props) {
  function isNullish(obj: any): obj is undefined | null {
    return obj == undefined || obj == null
  }

  let content: ReactNode = label && label(__note!, __index!)
  if (isNullish(content) && __label) {
    content = __label(__note!, __index!)
  }

  return (
    !isNullish(content) &&
    <div
      className='tremolo-piano-key-label-wrapper'
      css={css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'end',
        height: '100%',
        ...wrapperStyle
      })}
    >
      <div
        className={clsx('tremolo-piano-key-label', className)}
        css={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '0.6rem',
          height: 10,
          marginBottom: 10,
          padding: 4,
          borderRadius: 4,
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#888',
          aspectRatio: 1,
          maxWidth: 'calc(100% - 16px)',
          ...style
        })}
      >
        {content}
      </div>
    </div>
  )
}
