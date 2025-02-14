import React, { ComponentPropsWithoutRef, forwardRef, useImperativeHandle, useState } from "react"

import { KeyLabel, KeyLabelProps } from "./KeyLabel"
import { KeyMethods, KeyProps } from "./key"

export const BlackKey = forwardRef<KeyMethods, KeyProps & Omit<ComponentPropsWithoutRef<'div'>, keyof KeyProps>>(({
  width = 40 * 0.65,
  height = '60%',
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
  ...props
}: KeyProps & Omit<ComponentPropsWithoutRef<'div'>, keyof KeyProps>, ref) => {
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

  let keyLabelProps: KeyLabelProps = {}
  if (children != undefined) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type == KeyLabel) {
          keyLabelProps = child.props as KeyLabelProps
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
      data-active={played}
      style={{
        left: __position,
        width: __fill ? __width : (width ?? __width),
        height: height,
        ...style,
      }}
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
