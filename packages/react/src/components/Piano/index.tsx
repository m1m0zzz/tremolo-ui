import React, { createRef, ReactElement, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { css, CSSObject } from '@emotion/react'
import { isWhiteKey, NoteName, noteName, noteNames, parseNoteName } from '@tremolo-ui/functions'

import { useEventListener } from '../../hooks/useEventListener'

import { KeyMethods } from './key'
import { WhiteKey } from './WhiteKey'
import { BlackKey } from './BlackKey'
import { KeyBoardShortcuts } from './keyboardShortcuts'

/**
 * Piano component
 *
 * TODO:
 * - add scale highlight
 */

export interface PianoProps {
  // required
  noteRange: { first: number, last: number }

  // optional
  height?: number | string

  glissando?: boolean
  midiMax?: number
  keyboardShortcuts?: KeyBoardShortcuts
  fill?: boolean

  style?: CSSObject

  playNote?: (noteNumber: number) => void
  stopNote?: (noteNumber: number) => void

  label?: (note: number, index: number) => ReactNode

  /**
   * \<WhiteKey /> | \<BlackKey />
   */
  children?: ReactElement | ReactElement[]
}

export function Piano({
  noteRange,
  glissando = true,
  midiMax = 127,
  keyboardShortcuts,
  fill = false,
  height = fill ? '100%' : 160,
  style,
  playNote,
  stopNote,
  label,
  children,
}: PianoProps) {
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
    (_, i) => i + noteRange.first
  )
  const whiteNoteCount = noteRangeArray.filter((v) => isWhiteKey(v)).length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let whiteKeyProps: any, blackKeyProps: any
  if (children != undefined) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type == WhiteKey) {
          whiteKeyProps = child.props
        } else if (child.type == BlackKey) {
          blackKeyProps = child.props
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
    const octaveOffset = noteNames.indexOf(firstNoteName) > noteNames.indexOf(_noteName) ? 1 : 0
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
      setWhiteNoteWidth(whiteKeyProps?.width || 40)
    }
  }, [])

  useEventListener(window, 'keydown', (e) => {
    if (e.repeat) return
    if (!keyboardShortcuts) return
    const index = keyboardShortcuts.keys.indexOf(e.key)
    if (index != -1) {
      if (!keyRefs.current[index]?.current?.played()) {
        keyRefs.current[index]?.current?.play()
      }
    }
  })

  useEventListener(window, 'keyup', (e) => {
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
      className="tremolo-piano"
      css={css({
        display: 'inline-block',
        boxSizing: 'border-box',
        userSelect: 'none',
        width: fill ? '100%' : undefined,
        height: height,
        position: 'relative',
        ...style
      })}
      onPointerDown={() => {
        setPressed(true)
      }}
      onPointerUp={() => {
        setPressed(false)
      }}
    >
      {noteRangeArray.map((note, index) => {
        return (
          isWhiteKey(note) ? (
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
              __playNote={playNote}
              __stopNote={stopNote}
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
              __playNote={playNote}
              __stopNote={stopNote}
              __label={label}
              {...blackKeyProps}
            />
          )
        )
      })}
    </div>
  )
}

export * from './key'
export * from './keyboardShortcuts'

export { WhiteKey } from './WhiteKey'
export { BlackKey } from './BlackKey'
export { KeyLabel } from './KeyLabel'
