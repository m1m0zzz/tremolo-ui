/* eslint-disable react-hooks/exhaustive-deps */
import {
  createContext,
  useContext,
  ReactNode,
  useReducer,
  useEffect,
} from 'react'

import { clamp } from '@tremolo-ui/functions'
import { parseValue, Units } from '@tremolo-ui/functions/NumberInput'

const storeContext = createContext<Store>({
  value: '',
  valueAsNumber: 0,
  min: 0,
  max: 0,
  step: 0,
  keepWithinRange: true,
})
const dispatchContext = createContext<(action: ActionType) => void>(() => {})

interface Store {
  value: string
  valueAsNumber: number
  min: number
  max: number
  step: number
  keepWithinRange: boolean
  units?: string | Units
  digit?: number
}

interface ActionType {
  type: 'increment' | 'decrement' | 'change'
  value?: string
}

interface Props {
  value: string | number
  step: number
  keepWithinRange: boolean
  min?: number
  max?: number
  units?: string | Units
  digit?: number
  children: ReactNode
}

/** @category NumberInput */
export function NumberInputProvider({
  value: _value,
  step: _step,
  min: _min = Number.MIN_SAFE_INTEGER,
  max: _max = Number.MAX_SAFE_INTEGER,
  units: _units,
  digit: _digit,
  keepWithinRange: _keepWithinRange,
  children,
}: Props) {
  const [store, dispatch] = useReducer(valueReducer, {
    value: String(_value),
    valueAsNumber: parseValue(String(_value), _units, _digit).rawValue,
    step: _step,
    min: _min,
    max: _max,
    units: _units,
    digit: _digit,
    keepWithinRange: _keepWithinRange,
  })

  // TODO: store update
  // console.log('step: ', _step)

  useEffect(() => {
    store.value = parseValue(String(_value), _units, _digit).formatValue
  }, [_digit, _units, _value])
  useEffect(() => {
    store.valueAsNumber = parseValue(String(_value), _units, _digit).rawValue
  }, [_digit, _units, _value])
  useEffect(() => {
    store.step = _step
  }, [_step])
  useEffect(() => {
    store.min = _min
  }, [_min])
  useEffect(() => {
    store.max = _max
  }, [_max])
  useEffect(() => {
    store.units = _units
  }, [_units])
  useEffect(() => {
    store.digit = _digit
  }, [_digit])
  useEffect(() => {
    store.keepWithinRange = _keepWithinRange
  }, [_keepWithinRange])

  return (
    <storeContext.Provider value={store}>
      <dispatchContext.Provider value={dispatch}>
        {children}
      </dispatchContext.Provider>
    </storeContext.Provider>
  )
}

// : Reducer<Store, ActionType>
function valueReducer(store: Store, action: ActionType) {
  switch (action.type) {
    case 'increment': {
      let next =
        parseValue(store.value, store.units, store.digit).rawValue + store.step
      if (store.keepWithinRange) {
        next = clamp(next, store.min, store.max)
      }
      return {
        ...store,
        value: parseValue(String(next), store.units, store.digit).formatValue,
        valueAsNumber: next,
      }
    }
    case 'decrement': {
      let next =
        parseValue(store.value, store.units, store.digit).rawValue - store.step
      if (store.keepWithinRange) {
        next = clamp(next, store.min, store.max)
      }
      return {
        ...store,
        value: parseValue(String(next), store.units, store.digit).formatValue,
        valueAsNumber: next,
      }
    }
    case 'change': {
      const v = action.value ?? ''
      return {
        ...store,
        value: v,
        valueAsNumber: parseValue(v, store.units, store.digit).rawValue,
      }
    }
    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}

/** @category NumberInput */
export const useStore = () => useContext(storeContext)
/** @category NumberInput */
export const useDispatch = () => useContext(dispatchContext)
