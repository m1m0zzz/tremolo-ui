// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save
export const drawingState = [
  'strokeStyle',
  'fillStyle',
  'globalAlpha',
  'lineWidth',
  'lineCap',
  'lineJoin',
  'miterLimit',
  'lineDashOffset',
  'shadowOffsetX',
  'shadowOffsetY',
  'shadowBlur',
  'shadowColor',
  'globalCompositeOperation',
  'font',
  'textAlign',
  'textBaseline',
  'direction',
  'imageSmoothingEnabled',
] as const

export type DrawingState = (typeof drawingState)[number]
export type DrawingStateValue = CanvasRenderingContext2D[DrawingState]

export function isDrawingState(obj: unknown): obj is DrawingState {
  const d: string[] = [...drawingState]
  return typeof obj == 'string' && d.includes(obj)
}
