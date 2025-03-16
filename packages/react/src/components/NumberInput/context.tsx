import { createContext, useContext, useEffect, useRef } from 'react'
import { createStore, useStore } from 'zustand'

import { clamp } from '@tremolo-ui/functions'
import { parseValue, Units } from '@tremolo-ui/functions/NumberInput'

type State = {
  value: string
  valueAsNumber: number
  min?: number
  max?: number
  step?: number
  keepWithinRange?: boolean
  units?: string | Units
  digit?: number
  onChange?: (value: number, text: string) => void
}

type Action = {
  increment: () => void
  decrement: () => void
  change: (value: string) => void
}

type NumberInputStore = ReturnType<typeof createNumberInputStore>

type ProviderProps = Partial<Omit<State, 'value'> & { value: number | string }>

export function safeClamp(
  value: number,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
) {
  return clamp(value, min, max)
}

const createNumberInputStore = (initProps?: ProviderProps) => {
  const DEFAULT_PROPS: State = {
    value: '',
    valueAsNumber: 0,
    min: 0,
    max: 0,
    step: 1,
    keepWithinRange: true,
    onChange: (_v: number, _t: string) => {},
  }

  return createStore<State & Action>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    ...{
      value: parseValue(
        String(initProps?.value || ''),
        initProps?.units,
        initProps?.digit,
      ).formatValue,
      valueAsNumber: parseValue(
        String(initProps?.value || ''),
        initProps?.units,
        initProps?.digit,
      ).rawValue,
    },
    increment: () =>
      set((state) => {
        let next =
          parseValue(state.value, state.units, state.digit).rawValue +
          (state.step ?? 1)
        if (state.keepWithinRange) {
          next = safeClamp(next, state.min, state.max)
        }
        const v = parseValue(String(next), state.units, state.digit).formatValue
        state?.onChange?.(next, v)
        return {
          value: v,
          valueAsNumber: next,
        }
      }),
    decrement: () =>
      set((state) => {
        let next =
          parseValue(state.value, state.units, state.digit).rawValue -
          (state.step ?? 1)
        if (state.keepWithinRange) {
          next = safeClamp(next, state.min, state.max)
        }
        const v = parseValue(String(next), state.units, state.digit).formatValue
        state?.onChange?.(next, v)
        return {
          value: v,
          valueAsNumber: next,
        }
      }),
    change: (value) =>
      set((state) => {
        const v = value ?? ''
        return {
          value: v,
          valueAsNumber: parseValue(v, state.units, state.digit).rawValue,
        }
      }),
  }))
}

const NumberInputContext = createContext<NumberInputStore | null>(null)

type NumberInputProviderProps = React.PropsWithChildren<ProviderProps>

export function NumberInputProvider({
  children,
  ...props
}: NumberInputProviderProps) {
  const storeRef = useRef<NumberInputStore>()
  if (!storeRef.current) {
    storeRef.current = createNumberInputStore(props)
  }

  useEffect(() => {
    if (storeRef.current) {
      const parsed = parseValue(
        String(props?.value || ''),
        props?.units,
        props?.digit,
      )
      storeRef.current.setState({
        ...props,
        ...{
          value: parsed.formatValue,
          valueAsNumber: parsed.rawValue,
        },
      })
    } else {
      storeRef.current = createNumberInputStore(props)
    }
  }, [props])

  return (
    <NumberInputContext.Provider value={storeRef.current}>
      {children}
    </NumberInputContext.Provider>
  )
}

/** @category NumberInput */
export function useNumberInputContext<T>(
  selector: (state: State & Action) => T,
): T {
  const store = useContext(NumberInputContext)
  if (!store) throw new Error('Missing NumberInputContext.Provider in the tree')
  return useStore(store, selector)
}
