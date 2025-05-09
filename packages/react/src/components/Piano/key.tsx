import clsx from 'clsx'
import React, {
  CSSProperties,
  ComponentPropsWithoutRef,
  forwardRef,
  useImperativeHandle,
  useState,
  ReactElement,
} from 'react'

import { usePianoContext } from './context'
import { KeyLabel, KeyLabelProps } from './KeyLabel'

/**
 * @category Piano
 */
export interface KeyProps {
  noteNumber: number

  width?: number
  height?: number | `${number}%`

  bg?: string
  color?: string
  activeBg?: string
  activeColor?: string

  style?: CSSProperties

  /**
   * \<KeyLabel />
   */
  children?: ReactElement

  /** @internal */
  __width?: number
}

/**
 * @category Piano
 */
export interface KeyMethods {
  play: () => void
  stop: () => void
  played: () => boolean
}

type Props = KeyProps & Omit<ComponentPropsWithoutRef<'div'>, keyof KeyProps>
type ImplProps = Props & { keyType: 'black' | 'white' }

/** @category Piano */
export const defaultWhiteKeyWidth = 40
/** @category Piano */
export const defaultBlackKeyWidth = 26

const KeyImpl = forwardRef<KeyMethods, ImplProps>(
  (
    {
      keyType,
      noteNumber,
      width,
      height,
      bg,
      color,
      activeBg,
      activeColor,
      className,
      style,
      children,
      __width,
      ...props
    }: ImplProps,
    ref,
  ) => {
    const [played, setPlayed] = useState(false)
    const midiMax = usePianoContext((s) => s.midiMax)
    const fill = usePianoContext((s) => s.fill)
    // const glissando = usePianoContext(s => s.glissando)
    const onPlayNote = usePianoContext((s) => s.onPlayNote)
    const onStopNote = usePianoContext((s) => s.onStopNote)
    const label = usePianoContext((s) => s.label)
    const notePosition = usePianoContext((s) => s.notePosition)
    const position = notePosition(noteNumber)

    const disabled = noteNumber > midiMax
    const colors = {
      '--bg': bg,
      '--color': color,
      '--active-bg': activeBg,
      '--active-color': activeColor,
    }

    useImperativeHandle(ref, () => {
      return {
        play() {
          if (disabled) return
          setPlayed(true)
          if (onPlayNote) onPlayNote(noteNumber)
        },
        stop() {
          setPlayed(false)
          if (onStopNote) onStopNote(noteNumber)
        },
        played() {
          return played
        },
      }
    }, [disabled, noteNumber, onPlayNote, onStopNote, played])

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
        className={clsx(`tremolo-piano-${keyType}-key`, className)}
        aria-disabled={disabled}
        data-active={played}
        style={{
          ...colors,
          left: position,
          width: fill ? __width : width,
          height: height,
          ...style,
        }}
        // onPointerDown={() => {
        //   if (disabled) return
        //   setPlayed(true)
        //   if (onPlayNote) onPlayNote(noteNumber)
        // }}
        // onPointerEnter={() => {
        //   if (disabled) return
        //   if (glissando) {
        //     setPlayed(true)
        //     if (onPlayNote) onPlayNote(noteNumber)
        //   }
        // }}
        // onPointerUp={() => {
        //   if (disabled) return
        //   setPlayed(false)
        //   if (onStopNote) onStopNote(noteNumber)
        // }}
        // onPointerLeave={() => {
        //   if (disabled) return
        //   if (glissando) {
        //     setPlayed(false)
        //     if (onStopNote) onStopNote(noteNumber)
        //   }
        // }}
        {...props}
      >
        <KeyLabel label={label} __note={noteNumber} {...keyLabelProps} />
      </div>
    )
  },
)

/** @category Piano */
export const WhiteKey = forwardRef<KeyMethods, Props>(
  (
    {
      width = defaultWhiteKeyWidth,
      height = '100%',
      onContextMenu = (e) => e.preventDefault(),
      ...props
    }: Props,
    ref,
  ) => {
    return (
      <KeyImpl
        ref={ref}
        keyType="white"
        width={width}
        height={height}
        onContextMenu={onContextMenu}
        {...props}
      />
    )
  },
)

/** @category Piano */
export const BlackKey = forwardRef<KeyMethods, Props>(
  (
    {
      width = defaultBlackKeyWidth,
      height = '60%',
      onContextMenu = (e) => e.preventDefault(),
      ...props
    }: Props,
    ref,
  ) => {
    return (
      <KeyImpl
        ref={ref}
        keyType="black"
        width={width}
        height={height}
        onContextMenu={onContextMenu}
        {...props}
      />
    )
  },
)
