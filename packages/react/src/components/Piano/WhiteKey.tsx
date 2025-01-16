import { css, CSSObject } from "@emotion/react"
import {noteName } from "@tremolo-ui/functions"
import React from "react"
import { ReactElement, useState } from "react"
import { KeyLabel } from "./KeyLabel"

interface Props {
  width?: number
  height?: number | string

  bg?: string
  activeBg?: string
  style?: CSSObject

  /**
   * \<KeyLabel />
   */
  children?: ReactElement

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
  children,
  __glissando,
  __position,
  __note,
  __disabled,
  __playNote,
  __stopNote,
}: Props) {
  const [entered, setEntered] = useState(false)

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
      <KeyLabel
        __note={__note}
        {...keyLabelProps}
      />
    </div>
  )
}
