import clsx from 'clsx'
import React, {
  ComponentPropsWithoutRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react'

import { KeyMethods, KeyProps } from './key'
import { KeyLabel, KeyLabelProps } from './KeyLabel'

type Props = KeyProps & Omit<ComponentPropsWithoutRef<'div'>, keyof KeyProps>

/** @category Piano */
export const defaultWhiteKeyWidth = 40

/** @category Piano */
export const WhiteKey = forwardRef<KeyMethods, Props>(
  (
    {
      width = defaultWhiteKeyWidth,
      height = '100%',
      className,
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
    }: Props,
    ref,
  ) => {
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
        },
      }
    }, [__disabled, __note, __playNote, __stopNote, played])

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
        className={clsx(`tremolo-piano-white-key`, className)}
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
        {...props}
      >
        <KeyLabel
          __note={__note}
          __label={__label}
          __index={__index}
          {...keyLabelProps}
        />
      </div>
    )
  },
)
