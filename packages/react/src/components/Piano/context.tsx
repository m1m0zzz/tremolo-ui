import { createContext, ReactNode, useContext, useEffect, useRef } from 'react'
import { createStore, useStore } from 'zustand'

import { isBlackKey, noteKey, NoteKey, noteKeys } from '@tremolo-ui/functions'

import { defaultBlackKeyWidth, defaultWhiteKeyWidth } from './key'

/** @category Piano */
export type NoteRange = {
  first: number
  last: number
}

type State = {
  noteRange: NoteRange
  glissando: boolean
  midiMax: number
  fill: boolean
  onPlayNote: (noteNumber: number) => void
  onStopNote: (noteNumber: number) => void
  label: (note: number, index: number) => ReactNode
}

type Action = {
  notePosition: (note: number) => number
}

type PianoStore = ReturnType<typeof createPianoStore>

const createPianoStore = (initProps?: Partial<State>) => {
  const noteRange = initProps?.noteRange || { first: 0, last: 127 }
  const DEFAULT_PROPS: State = {
    noteRange: { first: 0, last: 127 },
    glissando: true,
    midiMax: 127,
    fill: false,
    label: () => undefined,
    onPlayNote: () => {},
    onStopNote: () => {},
  }

  return createStore<State & Action>()(() => ({
    ...DEFAULT_PROPS,
    ...initProps,
    notePosition: (note: number) => {
      const pitchPositions: Record<NoteKey, number> = {
        C: 0,
        'C#': 1,
        D: 1,
        'D#': 2,
        E: 2,
        F: 3,
        'F#': 4,
        G: 4,
        'G#': 5,
        A: 5,
        'A#': 6,
        B: 6,
      }

      const whiteNoteWidth = defaultWhiteKeyWidth
      const blackNoteWidth = defaultBlackKeyWidth
      const padding = 1

      const targetNoteKey = noteKey(note)
      const firstNoteKey = noteKey(noteRange.first)
      const octave = Math.floor((note - noteRange.first) / 12)
      const octaveOffset =
        noteKeys.indexOf(firstNoteKey) > noteKeys.indexOf(targetNoteKey) ? 1 : 0
      const w = whiteNoteWidth + padding
      const pos = pitchPositions[targetNoteKey] - pitchPositions[firstNoteKey]
      const blackKeyOffset = isBlackKey(note) ? blackNoteWidth / 2 : 0
      return pos * w + (octave + octaveOffset) * 7 * w - blackKeyOffset
    },
  }))
}

const PianoContext = createContext<PianoStore | null>(null)

type PianoProviderProps = React.PropsWithChildren<Partial<State>>

export function PianoProvider({ children, ...props }: PianoProviderProps) {
  const storeRef = useRef<PianoStore>(null)
  if (!storeRef.current) {
    storeRef.current = createPianoStore(props)
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.setState(props)
    } else {
      storeRef.current = createPianoStore(props)
    }
  }, [props])

  return (
    <PianoContext.Provider value={storeRef.current}>
      {children}
    </PianoContext.Provider>
  )
}

/** @category Piano */
export function usePianoContext<T>(selector: (state: State & Action) => T): T {
  const store = useContext(PianoContext)
  if (!store) throw new Error('Missing PianoContext.Provider in the tree')
  return useStore(store, selector)
}
