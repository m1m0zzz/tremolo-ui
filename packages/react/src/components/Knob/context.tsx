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
}

/**
 * 角度から円弧上の点を求める。
 *
 * 半径は線の太さの分だけ内側に取る必要があるが、太さは ActiveLine / InactiveLine が
 * それぞれ持つため、座標はストアで先に計算せず各コンポーネント側で求める。
 */
export function pointOnArc(angle: number, radius: number) {
  return {
    x: center + radius * Math.cos(radian(angle - 90)),
    y: center + radius * Math.sin(radian(angle - 90)),
  }
}

/** 線の太さが viewBox からはみ出さないようにした半径 */
export function arcRadius(strokeWidth: number | string | undefined) {
  const width =
    typeof strokeWidth === 'number'
      ? strokeWidth
      : Number.parseFloat(String(strokeWidth))
  return Number.isFinite(width) ? center - width / 2 : center
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

  return { p, r1, r2, r3, r4 }
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

export function useKnobContext<T>(
  selector: (state: State & DrawingState) => T,
): T {
  const store = useContext(KnobContext)
  if (!store) throw new Error('Missing KnobContext.Provider in the tree')
  return useStore(store, selector)
}
