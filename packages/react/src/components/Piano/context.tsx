import { createContext, ReactNode, useContext, useEffect, useRef } from 'react'
import { createStore, useStore } from 'zustand'

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
  onPlayNote: (noteNumber: number, velocity?: number) => void
  onStopNote: (noteNumber: number) => void
  label: (note: number, index: number) => ReactNode
}

type Action = {
  notePosition: (note: number) => number
}

type PianoStore = ReturnType<typeof createPianoStore>

const createPianoStore = (initProps: Partial<State> & Action) => {
  // const noteRange = initProps.noteRange || { first: 0, last: 127 }
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
    notePosition: initProps.notePosition,
  }))
}

const PianoContext = createContext<PianoStore | null>(null)

type PianoProviderProps = React.PropsWithChildren<Partial<State> & Action>

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
