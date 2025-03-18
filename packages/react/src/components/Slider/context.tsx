import { createContext, useContext, useEffect, useRef } from 'react'
import { createStore, useStore } from 'zustand'

type State = {
  min: number
  max: number
  step: number
  skew: number
  vertical: boolean
  reverse: boolean
  disabled: boolean
  readonly: boolean
}

type SliderStore = ReturnType<typeof createSliderStore>

const createSliderStore = (initProps?: Partial<State>) => {
  const DEFAULT_PROPS: State = {
    min: 0,
    max: 0,
    step: 0,
    skew: 0,
    vertical: false,
    reverse: false,
    disabled: false,
    readonly: false,
  }

  return createStore<State>()(() => ({
    ...DEFAULT_PROPS,
    ...initProps,
  }))
}

const SliderContext = createContext<SliderStore | null>(null)

type SliderProviderProps = React.PropsWithChildren<Partial<State>>

export function SliderProvider({ children, ...props }: SliderProviderProps) {
  const storeRef = useRef<SliderStore>(null)
  if (!storeRef.current) {
    storeRef.current = createSliderStore(props)
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.setState(props)
    } else {
      storeRef.current = createSliderStore(props)
    }
  }, [props])

  return (
    <SliderContext.Provider value={storeRef.current}>
      {children}
    </SliderContext.Provider>
  )
}

/** @category Slider */
export function useSliderContext<T>(selector: (state: State) => T): T {
  const store = useContext(SliderContext)
  if (!store) throw new Error('Missing SliderContext.Provider in the tree')
  return useStore(store, selector)
}
