import { css } from "@emotion/react"



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
  // const parseNoteName =
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
        }}
      >
      {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => {
        return (
          <div
            key={note}
            className="tremolo-piano-note"
            css={css({
              backgroundColor: 'white',
              width: 40,
              height: '100%',
              border: '1px solid #555',
              borderRadius: '0 0 8px 8px',
              cursor: 'pointer',
              '&:active': {
                backgroundColor: '#ccc',
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
              })}
            >
              <div
                css={css({
                  marginTop: 12,
                  marginBottom: 12,
                  backgroundColor: '#fff9',
                  width: '1rem',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  borderRadius: 4,
                })}
              >{note}</div>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

