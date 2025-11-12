import {
  createContext,
  createRef,
  RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { createStore, useStore } from 'zustand'

type State = {
  containerElementRef: RefObject<HTMLDivElement | null>
  disabled: boolean
  readonly: boolean
  bodyNoSelect: boolean
}

type Action = {
  setContainerElementRef: (
    containerElementRef: RefObject<HTMLDivElement | null>,
  ) => void
}

type PointsEditorStore = ReturnType<typeof createPointsEditorStore>

const createPointsEditorStore = (initProps: Partial<State & Action>) => {
  // const noteRange = initProps.noteRange || { first: 0, last: 127 }
  const DEFAULT_PROPS: State = {
    containerElementRef: createRef(),
    disabled: false,
    readonly: false,
    bodyNoSelect: true,
  }

  return createStore<State & Action>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setContainerElementRef: (containerElementRef) => {
      set(() => ({
        containerElementRef,
      }))
    },
  }))
}

const PointsEditorContext = createContext<PointsEditorStore | null>(null)

type PointsEditorProviderProps = React.PropsWithChildren<
  Partial<State & Action>
>

export function PointsEditorProvider({
  children,
  ...props
}: PointsEditorProviderProps) {
  const storeRef = useRef<PointsEditorStore>(null)
  if (!storeRef.current) {
    storeRef.current = createPointsEditorStore(props)
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.setState(props)
    } else {
      storeRef.current = createPointsEditorStore(props)
    }
  }, [props])

  return (
    <PointsEditorContext.Provider value={storeRef.current}>
      {children}
    </PointsEditorContext.Provider>
  )
}

/** @category PointsEditor */
export function usePointsEditorContext<T>(
  selector: (state: State & Action) => T,
): T {
  const store = useContext(PointsEditorContext)
  if (!store)
    throw new Error('Missing PointsEditorContext.Provider in the tree')
  return useStore(store, selector)
}
