import clsx from 'clsx'
import React, {
  ComponentPropsWithoutRef,
  createRef,
  CSSProperties,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  isWhiteKey,
  NoteName,
  noteName,
  noteNames,
  parseNoteName,
} from '@tremolo-ui/functions'

import { useEventListener } from '../../hooks/useEventListener'

import { BlackKey } from './BlackKey'
import { KeyMethods, KeyProps } from './key'
import { KeyBoardShortcuts } from './keyboardShortcuts'
import { defaultWhiteKeyWidth, WhiteKey } from './WhiteKey'

/**
 * Piano component
 *
 * TODO:
 * - add scale highlight
 */

/** @category Piano */
export interface PianoProps {
  // required
  noteRange: { first: number; last: number }

  // optional
  height?: number | string

  glissando?: boolean
  midiMax?: number
  keyboardShortcuts?: KeyBoardShortcuts
  fill?: boolean

  style?: CSSProperties

  onPlayNote?: (noteNumber: number) => void
  onStopNote?: (noteNumber: number) => void

  label?: (note: number, index: number) => ReactNode

  /**
   * \<WhiteKey /> | \<BlackKey />
   */
  children?: ReactElement | ReactElement[]
}

/** @category Piano */
export function Piano({
  noteRange,
  glissando = true,
  midiMax = 127,
  keyboardShortcuts,
  fill = false,
  height = fill ? '100%' : 160,
  style,
  className,
  onPlayNote,
  onStopNote,
  label,
  children,
  ...props
}: PianoProps & Omit<ComponentPropsWithoutRef<'div'>, keyof PianoProps>) {
  // -- state and ref ---
  const [pressed, setPressed] = useState(false)
  const [whiteNoteWidth, setWhiteNoteWidth] = useState(-1)
  const keyRefs = useRef<RefObject<KeyMethods>[]>([])
  for (let i = 0; i < noteRange.last - noteRange.first + 1; i++) {
    keyRefs.current[i] = createRef<KeyMethods>()
  }
  const pianoRef = useRef<HTMLDivElement>(null)

  // --- interpret props ---
  const noteRangeArray = Array.from(
    { length: noteRange.last - noteRange.first + 1 },
    (_, i) => i + noteRange.first,
  )
  const whiteNoteCount = noteRangeArray.filter((v) => isWhiteKey(v)).length

  let whiteKeyProps: KeyProps = {},
    blackKeyProps: KeyProps = {}
  if (children != undefined) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type == WhiteKey) {
          whiteKeyProps = child.props as KeyProps
        } else if (child.type == BlackKey) {
          blackKeyProps = child.props as KeyProps
        } else {
          throw new Error('only <WhiteKey> or <BlackKey>')
        }
      } else {
        throw new Error('children is an invalid element.')
      }
    })
  }

  // --- internal functions ---
  function notePosition(note: number) {
    const pitchPositions: Record<NoteName, number> = {
      C: 0,
      'C#': 0.55,
      D: 1,
      'D#': 1.8,
      E: 2,
      F: 3,
      'F#': 3.5,
      G: 4,
      'G#': 4.7,
      A: 5,
      'A#': 5.85,
      B: 6,
    }

    const toNoteName = (n: number) => {
      const { letter, accidental } = parseNoteName(noteName(n))
      return (letter + accidental) as NoteName
    }
    const _noteName = toNoteName(note)
    const firstNoteName = toNoteName(noteRange.first)
    const pos = pitchPositions[_noteName] - pitchPositions[firstNoteName]
    const octave = Math.floor((note - noteRange.first) / 12)
    const octaveOffset =
      noteNames.indexOf(firstNoteName) > noteNames.indexOf(_noteName) ? 1 : 0
    const length = whiteNoteWidth + 3
    return pos * length + (octave + octaveOffset) * 7 * length
  }

  // --- hooks ---
  useEffect(() => {
    if (fill && pianoRef.current) {
      const parent = pianoRef.current.parentElement
      if (!parent) throw new Error("doesn't have a parent element.")
      const resizeObserver = new ResizeObserver(() => {
        const w = pianoRef.current!.clientWidth
        setWhiteNoteWidth(w / whiteNoteCount - 3)
      })
      resizeObserver.observe(parent)
    } else {
      setWhiteNoteWidth(whiteKeyProps?.width || defaultWhiteKeyWidth)
    }
  }, [fill, whiteKeyProps?.width, whiteNoteCount])

  useEventListener(globalThis.window, 'keydown', (e) => {
    if (e.repeat) return
    if (!keyboardShortcuts) return
    const index = keyboardShortcuts.keys.indexOf(e.key)
    if (index != -1) {
      if (!keyRefs.current[index]?.current?.played()) {
        keyRefs.current[index]?.current?.play()
      }
    }
  })

  useEventListener(globalThis.window, 'keyup', (e) => {
    if (e.repeat) return
    if (!keyboardShortcuts) return
    const index = keyboardShortcuts.keys.indexOf(e.key)
    if (index != -1) {
      keyRefs.current[index]?.current?.stop()
    }
  })

  return (
    <div
      ref={pianoRef}
      className={clsx('tremolo-piano', className)}
      style={{
        width: fill ? '100%' : (whiteNoteWidth + 3) * whiteNoteCount,
        height: height,
        ...style,
      }}
      onPointerDown={(e) => {
        if (props.onPointerDown) props.onPointerDown(e)
        setPressed(true)
      }}
      onPointerUp={(e) => {
        if (props.onPointerUp) props.onPointerUp(e)
        setPressed(false)
      }}
      {...props}
    >
      {noteRangeArray.map((note, index) => {
        return isWhiteKey(note) ? (
          <WhiteKey
            key={note}
            ref={keyRefs.current[index]}
            __glissando={glissando && pressed}
            __position={notePosition(note)}
            __note={note}
            __disabled={note > midiMax}
            __index={index}
            __fill={fill}
            __width={whiteNoteWidth}
            __onPlayNote={onPlayNote}
            __onStopNote={onStopNote}
            __label={label}
            {...whiteKeyProps}
          />
        ) : (
          <BlackKey
            key={note}
            ref={keyRefs.current[index]}
            __glissando={glissando && pressed}
            __position={notePosition(note)}
            __note={note}
            __disabled={note > midiMax}
            __index={index}
            __fill={fill}
            __width={whiteNoteWidth * 0.65}
            __onPlayNote={onPlayNote}
            __onStopNote={onStopNote}
            __label={label}
            {...blackKeyProps}
          />
        )
      })}
    </div>
  )
}

export * from './key'
export * from './keyboardShortcuts'

export { WhiteKey } from './WhiteKey'
export { BlackKey } from './BlackKey'
export { KeyLabel, type KeyLabelProps } from './KeyLabel'
