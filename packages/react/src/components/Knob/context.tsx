import { createContext, useContext } from 'react'

import { normalizeValue, radian } from '@tremolo-ui/functions'

export const viewBoxSize = 100
export const center = viewBoxSize / 2

export type KnobConfig = {
  value: number
  min: number
  max: number
  step: number
  skew: number
  startValue: number
  /** angle range [degree] */
  angleRange: number
}

export type KnobContextValue = KnobConfig & {
  /** normalized value */
  p: number
  /** ロータリー開始位置 */
  r1: number
  /** activeLine の開始位置 */
  r2: number
  /** activeLine の終了位置 */
  r3: number
  /** ロータリー終了位置 */
  r4: number
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

/** 設定から描画に必要な角度を導出する。レンダー中に呼ぶ。 */
export function calcAngles({
  value,
  min,
  max,
  skew,
  startValue,
  angleRange,
}: KnobConfig) {
  const p = normalizeValue(value, min, max, skew)
  const s = normalizeValue(startValue, min, max, skew)

  const r1 = -angleRange / 2
  const r2 = r1 + Math.min(p, s) * angleRange
  const r3 = r1 + Math.max(p, s) * angleRange
  const r4 = angleRange / 2

  return { p, r1, r2, r3, r4 }
}

const KnobContext = createContext<KnobContextValue | null>(null)

export const KnobProvider = KnobContext.Provider

/**
 * Everything here is derived during render, so there is no state to keep in
 * sync: `value` comes from the props of `Root` and the rest follows from it.
 */
export function useKnobContext(): KnobContextValue
export function useKnobContext<T>(selector: (state: KnobContextValue) => T): T
export function useKnobContext<T>(selector?: (state: KnobContextValue) => T) {
  const context = useContext(KnobContext)
  if (!context) throw new Error('Missing KnobContext.Provider in the tree')
  return selector ? selector(context) : context
}
