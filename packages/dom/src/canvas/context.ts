/**
 * The assignable parts of a 2D context's drawing state. They have to be
 * carried across a resize by hand because setting `canvas.width` resets the
 * context to its defaults. The transform and line dash are handled separately
 * by {@link DrawingContext} because they are exposed through methods.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save
 */
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
  'filter',
  'font',
  'fontKerning',
  'fontStretch',
  'fontVariantCaps',
  'textAlign',
  'textBaseline',
  'direction',
  'letterSpacing',
  'textRendering',
  'wordSpacing',
  'imageSmoothingEnabled',
  'imageSmoothingQuality',
] as const

export type DrawingState = (typeof drawingState)[number]
export type DrawingStateValue = CanvasRenderingContext2D[DrawingState]
export type DrawingContext = Pick<CanvasRenderingContext2D, DrawingState> & {
  /** The current line dash sequence. */
  lineDash: number[]
  /** The current transformation matrix. */
  transform: DOMMatrix
}

export function isDrawingState(value: unknown): value is DrawingState {
  const names: readonly string[] = drawingState
  return typeof value === 'string' && names.includes(value)
}

/** Copy the drawing state off a context, to put back after a resize. */
export function readDrawingState(
  context: CanvasRenderingContext2D,
): DrawingContext {
  const state = {} as DrawingContext
  for (const property of drawingState) {
    ;(state[property] as DrawingStateValue) = context[property]
  }
  state.lineDash = context.getLineDash()
  state.transform = context.getTransform()
  return state
}

/** Put a state read by {@link readDrawingState} back onto a context. */
export function writeDrawingState(
  context: CanvasRenderingContext2D,
  state: DrawingContext,
  transformScale = 1,
) {
  for (const property of drawingState) {
    ;(context[property] as DrawingStateValue) = state[property]
  }
  context.setLineDash(state.lineDash)
  const { a, b, c, d, e, f } = state.transform
  context.setTransform(
    a * transformScale,
    b * transformScale,
    c * transformScale,
    d * transformScale,
    e * transformScale,
    f * transformScale,
  )
}

/**
 * Give the canvas a backing store of `width * dpr` by `height * dpr` device
 * pixels while keeping it `width` by `height` in CSS pixels, and scale the
 * context so that drawing code can work in CSS pixels throughout.
 *
 * Assigning to `canvas.width` clears the canvas and resets the context, so
 * this both resizes and re-establishes the transform.
 */
export function applyDevicePixelRatio(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
) {
  canvas.width = width * dpr
  canvas.height = height * dpr
  // Reset the current transformation matrix to the identity matrix
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(dpr, dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
}
