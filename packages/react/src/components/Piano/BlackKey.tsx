import { css, CSSObject } from "@emotion/react"
import { noteName } from "@tremolo-ui/functions"

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

export function BlackKey({
  width = 40 * 0.65,
  height = '60%',
  style,
  __position,
  __note,
  __disabled,
}: Props) {
  return (
    <div
      className={`tremolo-piano-black-key`}
      aria-disabled={__disabled}
      css={css({
        position: 'absolute',
        backgroundColor: '#333',
        color: 'white',
        left: __position,
        width: width,
        height: height,
        border: '1px solid #555',
        borderRadius: '0 0 8px 8px',
        cursor: __disabled ? 'not-allowed' : 'pointer',
        zIndex: 2,
        '&:active': __disabled ? {} : {
          backgroundColor: '#666',
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

