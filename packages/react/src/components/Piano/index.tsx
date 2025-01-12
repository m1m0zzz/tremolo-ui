import { css } from "@emotion/react"
import { isWhiteKey, NoteName, noteName, parseNoteName } from "@tremolo-ui/functions"
import React, { ReactElement } from "react"
import { useRef } from "react"
import { WhiteKey } from "./WhiteKey"
import { BlackKey } from "./BlackKey"

/**
 * Piano component
 *
 * TODO:
 * - add playNote and stopNote functions
 * - add highlighting notes
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

interface Props {
  noteRange: { first: number, last: number }
  midiMax?: number
  fill?: boolean
  playNote?: (noteNumber: number) => void
  stopNote?: (noteNumber: number) => void
  children?: ReactElement | ReactElement[]
}

export function Piano({
  noteRange,
  midiMax = 127,
  fill = false,
  playNote,
  stopNote,
  children,
}: Props) {
  // -- state and ref ---
  const noteRangeArray = Array.from(
    { length: noteRange.last - noteRange.first + 1 },
    (_, i) => i + noteRange.first
  )
  const isPressed = useRef(false)

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

  return (
    <div
      className="tremolo-piano"
      style={{
        display: 'inline-block',
        boxSizing: 'border-box',
        userSelect: 'none',
        height: 160,
        position: 'relative',
      }}
    >
      {noteRangeArray.map((note) => {
        return (
          isWhiteKey(note) ? (
            <WhiteKey
              key={note}
              __position={notePosition(note)}
              __note={note}
              __disabled={note > midiMax}
              {...whiteKeyProps}
            />
          ) : (
            <BlackKey
              key={note}
              __position={notePosition(note)}
              __note={note}
              __disabled={note > midiMax}
              {...blackKeyProps}
            />
          )
        )
      })}
    </div>
  )
}

export { WhiteKey } from "./WhiteKey"
export { BlackKey } from "./BlackKey"
