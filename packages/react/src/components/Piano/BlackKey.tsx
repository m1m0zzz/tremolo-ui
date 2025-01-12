import { css, CSSObject } from "@emotion/react"
import { noteName } from "@tremolo-ui/functions"
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
}

export function BlackKey({
  width = 40 * 0.65,
  height = '60%',
  bg = '#333',
  activeBg = '#666',
  style,
  __glissando,
  __position,
  __note,
  __disabled,
}: Props) {
  const [entered, setEntered] = useState(false)

  return (
    <div
      className={`tremolo-piano-black-key`}
      aria-disabled={__disabled}
      css={css({
        position: 'absolute',
        backgroundColor: entered ? activeBg : bg,
        color: 'white',
        left: __position,
        width: width,
        height: height,
        border: '1px solid #555',
        borderRadius: '0 0 8px 8px',
        cursor: __disabled ? 'not-allowed' : 'pointer',
        zIndex: 2,
        ...style,
      })}
      onPointerDown={() => {
        if (__disabled) return
        setEntered(true)
        console.log('play: ', __note)
      }}
      onPointerUp={() => {
        if (__disabled) return
        setEntered(false)
      }}
      onPointerEnter={() => {
        if (__disabled) return
        if (__glissando) {
          setEntered(true)
          console.log('play: ', __note)
        }
      }}
      onPointerLeave={(e) => {
        if (__disabled) return
        e.preventDefault()
        setEntered(false)
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

