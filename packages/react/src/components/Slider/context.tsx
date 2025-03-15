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
}

type Action = {
  updateMin: (min: State['min']) => void
  updateMax: (max: State['max']) => void
  updateStep: (step: State['step']) => void
  updateSkew: (skew: State['skew']) => void
  updateVertical: (vertical: State['vertical']) => void
  updateReverse: (reverse: State['reverse']) => void
  updateDisabled: (disabled: State['disabled']) => void
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
  }

  return createStore<State & Action>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    updateMin: (min) => set(() => ({ min: min })),
    updateMax: (max) => set(() => ({ max: max })),
    updateStep: (step) => set(() => ({ step: step })),
    updateSkew: (skew) => set(() => ({ skew: skew })),
    updateVertical: (vertical) => set(() => ({ vertical: vertical })),
    updateReverse: (reverse) => set(() => ({ reverse: reverse })),
    updateDisabled: (disabled) => set(() => ({ disabled: disabled })),
  }))
}

const SliderContext = createContext<SliderStore | null>(null)

type SliderProviderProps = React.PropsWithChildren<Partial<State>>

export function SliderProvider({ children, ...props }: SliderProviderProps) {
  const storeRef = useRef<SliderStore>()
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
export function useSliderContext<T>(selector: (state: State & Action) => T): T {
  const store = useContext(SliderContext)
  if (!store) throw new Error('Missing SliderContext.Provider in the tree')
  return useStore(store, selector)
}
