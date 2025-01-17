import { css, CSSObject } from "@emotion/react"
import clsx from "clsx"
import { ReactNode } from "react"

interface Props {
  label?: (note: number, index: number) => ReactNode


  className?: string
  style?: CSSObject
  children?: ReactNode

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
  children,
  __note,
  __index,
  __label,
}: Props) {
  return (
    children ? children :
      <div
        className={clsx('tremolo-piano-key-label', className)}
        css={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'end',
          height: '100%',
          fontSize: '0.6rem',
          textAlign: 'center',
          ...style
        })}
      >
        <div
          css={{
            marginTop: 8,
            marginBottom: 8,
            padding: 4,
            borderRadius: 4,
          }}
        >
          {
            label ? label(__note!, __index!) :
            __label ? __label(__note!, __index!) : undefined
          }
        </div>
      </div>
  )
}
