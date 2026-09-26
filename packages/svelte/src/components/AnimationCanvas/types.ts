import type { AnimationFrame } from '@tremolo-ui/dom'

/** Called once the canvas is ready, and again whenever it is resized. */
export type InitFunction = (
  context: CanvasRenderingContext2D,
  size: { width: number; height: number },
) => void

/** Called on every frame while `animate` is on, and once otherwise. */
export type DrawFunction = (
  context: CanvasRenderingContext2D,
  frame: AnimationFrame,
) => void

export interface AnimationCanvasProps {
  /** Draws a frame. */
  draw: DrawFunction
  /** Sets the canvas up before the first frame and after a resize. */
  init?: InitFunction
  /**
   * Draw on every animation frame. Off, `draw` runs once and again after a
   * resize.
   * @default true
   */
  animate?: boolean
  /** Settings for the 2D context. Read once, when the canvas is created. */
  options?: CanvasRenderingContext2DSettings
  /**
   * Keep the drawing while the canvas is resized, rather than letting it
   * flash blank until the next frame.
   * @default true
   */
  reduceFlickering?: boolean
  /**
   * Follow the size of the parent element. `width` and `height` are ignored.
   * @default false
   */
  resizable?: boolean
  /**
   * Width in CSS pixels, while not `resizable`.
   * @default 100
   */
  width?: number
  /**
   * Height in CSS pixels, while not `resizable`.
   * @default 100
   */
  height?: number
  /** The canvas, bound with `bind:ref`. */
  ref?: HTMLCanvasElement | null
}
