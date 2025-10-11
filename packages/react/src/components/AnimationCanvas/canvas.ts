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
export type DrawingContext = Pick<CanvasRenderingContext2D, DrawingState>

export function isDrawingState(obj: unknown): obj is DrawingState {
  const d: string[] = [...drawingState]
  return typeof obj == 'string' && d.includes(obj)
}

export function setDprConfig(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
) {
  canvas.width = width * dpr
  canvas.height = height * dpr
  // Reset current transformation matrix to the identity matrix
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(dpr, dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
}
