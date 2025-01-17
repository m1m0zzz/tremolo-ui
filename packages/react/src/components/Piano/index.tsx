import React, { createRef, ReactElement, ReactNode, RefObject, useRef, useState } from 'react'
import { css, CSSObject } from '@emotion/react'
import { isWhiteKey, NoteName, noteName, parseNoteName } from '@tremolo-ui/functions'

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
  height = 160,
  glissando = true,
  midiMax = 127,
  keyboardShortcuts,
  fill = false,
  style,
  playNote,
  stopNote,
  label,
  children,
}: PianoProps) {
  // -- state and ref ---
  const noteRangeArray = Array.from(
    { length: noteRange.last - noteRange.first + 1 },
    (_, i) => i + noteRange.first
  )
  const [pressed, setPressed] = useState(false)
  const keyRefs = useRef<RefObject<KeyMethods>[]>([])
  noteRangeArray.forEach((_, index) => {
    keyRefs.current[index] = createRef<KeyMethods>()
  })

  // --- interpret props ---

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
  const noteWidth = whiteKeyProps?.width || 40
  function notePosition(note: number) {
    const cToB = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const toNoteName = (n: number) => {
      const { letter, accidental } = parseNoteName(noteName(n))
      return (letter + accidental) as NoteName
    }
    const _noteName = toNoteName(note)
    const firstNoteName = toNoteName(noteRange.first)
    const pos = pitchPositions[_noteName] - pitchPositions[firstNoteName]
    const octave = Math.floor((note - noteRange.first) / 12)
    const octaveOffset = cToB.indexOf(firstNoteName) > cToB.indexOf(_noteName) ? 1 : 0
    const length = noteWidth + 3
    return pos * length + (octave + octaveOffset) * 7 * length
  }

  // --- hooks ---
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
      className="tremolo-piano"
      css={css({
        display: 'inline-block',
        boxSizing: 'border-box',
        userSelect: 'none',
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
export { WhiteKey } from './WhiteKey'
export { BlackKey } from './BlackKey'
export { KeyLabel } from './KeyLabel'

export * from './keyboardShortcuts'
