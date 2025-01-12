import { css, CSSObject } from "@emotion/react"
import {noteName } from "@tremolo-ui/functions"

interface Props {
  width?: number
  height?: number | string
  style?: CSSObject

  /** @internal */
  __position?: number
  /** @internal */
  __note?: number
  /** @internal */
  __disabled?: boolean
}

export function WhiteKey({
  width = 40,
  height = '100%',
  style,
  __position,
  __note,
  __disabled,
}: Props) {
  return (
    <div
      className={`tremolo-piano-white-key`}
      aria-disabled={__disabled}
      css={css({
        position: 'absolute',
        backgroundColor: 'white',
        color: 'black',
        left: __position,
        width: width,
        height: height,
        border: '1px solid #555',
        borderRadius: '0 0 8px 8px',
        cursor: __disabled ? 'not-allowed' : 'pointer',
        zIndex: 1,
        '&:active': __disabled ? {} : {
          backgroundColor: '#ccc',
        },
        ...style,
      })}
      onPointerDown={() => {
        console.log('pointer down', __note)
        // isPressed.current = true
      }}
      onPointerEnter={() => {
        console.log('mouse enter', __note)
      }}
      onPointerLeave={() => {}}
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
