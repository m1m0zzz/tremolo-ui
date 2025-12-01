import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { createStore, useStore } from 'zustand'

import { normalizeValue, radian } from '@tremolo-ui/functions'

export const viewBoxSize = 100
export const center = viewBoxSize / 2

type State = {
  value: number
  min: number
  max: number
  step: number
  skew: number // | SkewFunction // TODO
  startValue: number
  angleRange: number
}

type DrawingState = {
  p: number // normalized value
  r1: number // ロータリー開始位置
  r2: number // activeLineの開始位置
  r3: number // activeLineの終了位置
  r4: number // ロータリー終了位置
  x1: number
  y1: number
  x2: number
  y2: number
  x3: number
  y3: number
  x4: number
  y4: number
}

function calcDrawingState({
  value,
  min,
  max,
  skew,
  startValue,
  angleRange,
}: State) {
  const p = normalizeValue(value, min, max, skew)
  const s = normalizeValue(startValue, min, max, skew)

  const r1 = -angleRange / 2
  const r2 = r1 + Math.min(p, s) * angleRange
  const r3 = r1 + Math.max(p, s) * angleRange
  const r4 = angleRange / 2
  const x1 = center + center * Math.cos(radian(r1 - 90))
  const y1 = center + center * Math.sin(radian(r1 - 90))
  const x2 = center + center * Math.cos(radian(r2 - 90))
  const y2 = center + center * Math.sin(radian(r2 - 90))
  const x3 = center + center * Math.cos(radian(r3 - 90))
  const y3 = center + center * Math.sin(radian(r3 - 90))
  const x4 = center + center * Math.cos(radian(r4 - 90))
  const y4 = center + center * Math.sin(radian(r4 - 90))

  return {
    p,
    r1,
    r2,
    r3,
    r4,
    x1,
    y1,
    x2,
    y2,
    x3,
    y3,
    x4,
    y4,
  }
}

type KnobStore = ReturnType<typeof createKnobStore>

const createKnobStore = (initProps: State) => {
  return createStore<State & DrawingState>()(() => ({
    ...initProps,
    ...calcDrawingState(initProps),
  }))
}

const KnobContext = createContext<KnobStore | null>(null)

export function KnobProvider({ children, ...props }: PropsWithChildren<State>) {
  const storeRef = useRef<KnobStore>(null)
  if (!storeRef.current) {
    storeRef.current = createKnobStore(props)
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.setState({ ...props, ...calcDrawingState(props) })
    } else {
      storeRef.current = createKnobStore(props)
    }
  }, [props])

  return (
    <KnobContext.Provider value={storeRef.current}>
      {children}
    </KnobContext.Provider>
  )
}

/** @category Knob */
export function useKnobContext<T>(
  selector: (state: State & DrawingState) => T,
): T {
  const store = useContext(KnobContext)
  if (!store) throw new Error('Missing KnobContext.Provider in the tree')
  return useStore(store, selector)
}
