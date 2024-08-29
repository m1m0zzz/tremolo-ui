export type Horizontal = "right" | "left"
export type Vertical = "up" | "down"
export type Direction = Horizontal | Vertical

export function isHorizontal(d: Direction) {
  return d == "right" || d == "left"
}

export function isVertical(d: Direction) {
  return d == "up" || d == "down"
}

export function isReversed(d: Direction) {
  return d == "left" || d == "up"
}

export function gradientDirection(d: Direction) {
  if (d == "left" || d == "right") return d
  if (d == "up") return "top"
  if (d == "down") return "bottom"
}

// export type SkewFunction = (x: number) => number

export type ScaleType = "mark" | "mark-number" | "number"
export type ScaleOrderList = {
  at: number,
  type: ScaleType,
  style?: {
    markColor?: string,
    labelColor?: string,
    length?: number | string,
    thickness?: number | string,
  }
}

export type ScaleOption = {
  markColor?: string,
  labelColor?: string,
  gap?: number | string,
  style?: React.CSSProperties
}

export type WheelOption = ["normalized" | "raw", number]
