import { css } from "@emotion/react"
import { isNatural, NoteName, noteName } from "@tremolo-ui/functions"

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
  playNote?: (noteNumber: number) => void
  stopNote?: (noteNumber: number) => void
}

export function Piano({
  noteRange,
  playNote,
  stopNote,
}: Props) {
  const noteRangeArray = Array.from({ length: noteRange.last - noteRange.first + 1 }, (_, i) => i + noteRange.first)
  const noteNameRangeArray = noteRangeArray.map(noteName)
  console.log(noteRangeArray)
  const noteWidth = 40

  function notePosition(note: number) {
    const cToB = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const _noteName = noteName(note).slice(0, -1) as NoteName
    const firstNoteName = noteName(noteRange.first).slice(0, -1) as NoteName
    const pos = pitchPositions[_noteName] - pitchPositions[firstNoteName]
    const octave = Math.floor((note - noteRange.first) / 12)
    const octaveOffset = cToB.indexOf(firstNoteName) > cToB.indexOf(_noteName) ? 1 : 0
    return pos * (noteWidth + 3) + (octave + octaveOffset) * 7 * (noteWidth + 3)
  }

  return (
    <div
      className="tremolo-piano-wrapper"
      style={{
        display: 'inline-block',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: 160,
          gap: 1,
          position: 'relative',
        }}
      >
      {noteRangeArray.map((note) => {
        return (
          <div
            key={note}
            className="tremolo-piano-note"
            css={css({
              position: 'absolute',
              backgroundColor: isNatural(note) ? 'white' : '#333',
              color: isNatural(note) ? 'black' : 'white',
              left: notePosition(note),
              width: isNatural(note) ? noteWidth : noteWidth * 0.65,
              height: isNatural(note) ? '100%' : '60%',
              border: '1px solid #555',
              borderRadius: '0 0 8px 8px',
              cursor: 'pointer',
              zIndex: isNatural(note) ? 1 : 2,
              '&:active': {
                backgroundColor: isNatural(note) ? '#ccc' : '#666',
              }
            })}
            onPointerDown={() => {
              console.log('pointer down', note)
            }}
            onPointerEnter={() => {
              console.log('mouse enter', note)
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
              >{noteName(note)}</div>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

