import { css } from "@emotion/react"
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react"

import { KeyLabel } from "./KeyLabel"
import { KeyMethods, KeyProps } from "./key"

export const BlackKey = forwardRef<KeyMethods, KeyProps>(({
  width = 40 * 0.65,
  height = '60%',
  bg = '#333',
  activeBg = '#666',
  style,
  children,
  __glissando,
  __position,
  __note,
  __disabled,
  __index,
  __fill,
  __width,
  __playNote,
  __stopNote,
  __label,
}: KeyProps, ref) => {
  const [played, setPlayed] = useState(false)

  useImperativeHandle(ref, () => {
    return {
      play() {
        if (__disabled) return
        setPlayed(true)
        if (__playNote) __playNote(__note!)
      },
      stop() {
        setPlayed(false)
        if (__stopNote) __stopNote(__note!)
      },
      played() {
        return played
      }
    }
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let keyLabelProps: any
  if (children != undefined) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type == KeyLabel) {
          keyLabelProps = child.props
        } else {
          throw new Error('only <KeyLabel>')
        }
      } else {
        throw new Error('children is an invalid element.')
      }
    })
  }

  return (
    <div
      className={`tremolo-piano-black-key`}
      aria-disabled={__disabled}
      css={css({
        position: 'absolute',
        backgroundColor: played ? activeBg : bg,
        color: 'white',
        left: __position,
        width: __fill ? __width : (width ?? __width),
        height: height,
        border: '1px solid #555',
        borderRadius: '0 0 8px 8px',
        cursor: __disabled ? 'not-allowed' : 'pointer',
        zIndex: 2,
        ...style,
      })}
      onPointerDown={() => {
        if (__disabled) return
        setPlayed(true)
        if (__playNote) __playNote(__note!)
      }}
      onPointerEnter={() => {
        if (__disabled) return
        if (__glissando) {
          setPlayed(true)
          if (__playNote) __playNote(__note!)
        }
      }}
      onPointerUp={() => {
        if (__disabled) return
        setPlayed(false)
        if (__stopNote) __stopNote(__note!)
      }}
      onPointerLeave={() => {
        if (__disabled) return
        setPlayed(false)
        if (__stopNote) __stopNote(__note!)
      }}
    >
      <KeyLabel
        __note={__note}
        __label={__label}
        __index={__index}
        {...keyLabelProps}
      />
    </div>
  )
})
