import { css, CSSObject } from "@emotion/react"
import {noteName } from "@tremolo-ui/functions"
import { useState } from "react"

interface Props {
  width?: number
  height?: number | string

  bg?: string
  activeBg?: string
  style?: CSSObject

  /** @internal */
  __glissando?: boolean
  /** @internal */
  __position?: number
  /** @internal */
  __note?: number
  /** @internal */
  __disabled?: boolean
  /** @internal */
  __playNote?: (noteNumber: number) => void
  /** @internal */
  __stopNote?: (noteNumber: number) => void
}

export function WhiteKey({
  width = 40,
  height = '100%',
  bg = 'white',
  activeBg = '#ccc',
  style,
  __glissando,
  __position,
  __note,
  __disabled,
  __playNote,
  __stopNote,
}: Props) {
  const [entered, setEntered] = useState(false)

  return (
    <div
      className={`tremolo-piano-white-key`}
      aria-disabled={__disabled}
      css={css({
        position: 'absolute',
        backgroundColor: entered ? activeBg : bg,
        color: 'black',
        left: __position,
        width: width,
        height: height,
        border: '1px solid #555',
        borderRadius: '0 0 8px 8px',
        cursor: __disabled ? 'not-allowed' : 'pointer',
        zIndex: 1,
        ...style,
      })}
      onPointerDown={() => {
        if (__disabled) return
        setEntered(true)
        if (__playNote) __playNote(__note!)
      }}
      onPointerEnter={() => {
        if (__disabled) return
        if (__glissando) {
          setEntered(true)
          if (__playNote) __playNote(__note!)
        }
      }}
      onPointerUp={() => {
        if (__disabled) return
        setEntered(false)
        if (__stopNote) __stopNote(__note!)
      }}
      onPointerLeave={() => {
        if (__disabled) return
        setEntered(false)
        if (__stopNote) __stopNote(__note!)
      }}
    >
      <div
        className="tremolo-piano-note-label"
        css={css({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'end',
          height: '100%',
          fontSize: '0.6rem',
          textAlign: 'center',
        })}
      >
        <div
          css={css({
            marginTop: 8,
            marginBottom: 8,
            padding: 4,
            borderRadius: 4,
          })}
        >{noteName(__note!)}</div>
      </div>
    </div>
  )
}
