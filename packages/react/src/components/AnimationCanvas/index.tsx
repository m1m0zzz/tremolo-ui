import {
  ComponentPropsWithoutRef,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  createAnimationCanvas,
  type AnimationCanvasInstance,
  type AnimationFrame,
} from '@tremolo-ui/dom'

import { useComposedRefs } from '../../compose-refs'

export type InitFunction = (
  context: CanvasRenderingContext2D,
  option: {
    /** current canvas width */
    width: number
    /** current canvas height */
    height: number
  },
) => void

export type DrawFunction = (
  context: CanvasRenderingContext2D,
  option: AnimationFrame,
) => void

export interface AnimationCanvasCommonProps {
  /**
   * Draw one frame. It is given the 2D context and the frame: the size in CSS
   * pixels, `count`, `deltaTime`, `elapsedTime` and `fps`.
   *
   * A new function replaces the old one in place, so writing it inline does
   * not restart anything.
   */
  draw: DrawFunction
  /**
   * Called once before the first frame, with the context and the size in CSS
   * pixels. Set up what every frame shares here.
   */
  init?: InitFunction
  /**
   * Redraw on every animation frame. Turn it off to draw only when there is a
   * reason to: when the canvas mounts, when it is resized, and when the
   * component re-renders.
   *
   * @default true
   */
  animate?: boolean
  /**
   * Read once, when the 2D context is created, so changing it later has no
   * effect. Passing a fresh object on every render is therefore harmless.
   *
   * @see https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext#contextattributes
   */
  options?: CanvasRenderingContext2DSettings
  /**
   * Carry the drawing across a resize, so that the canvas does not blank for a
   * frame while the new size is drawn. A fixed canvas is resized too, when its
   * `width` or `height` changes.
   *
   * @default true
   */
  reduceFlickering?: boolean
}

/** A canvas of the size given in CSS pixels. This is the default. */
export interface AnimationCanvasFixedProps {
  /** Leave it out, or pass `false`, for a canvas of the size below. */
  resizable?: false
  /**
   * Width of the canvas in CSS pixels.
   * @default 100
   */
  width?: number
  /**
   * Height of the canvas in CSS pixels.
   * @default 100
   */
  height?: number
}

/**
 * A canvas that follows the size of its parent element, so the parent needs a
 * size of its own.
 */
export interface AnimationCanvasResizableProps {
  /**
   * Follow the size of the parent element instead of `width` and `height`.
   * Switching it rebuilds the canvas.
   */
  resizable: true
  /** Not accepted: the size comes from the parent element. */
  width?: never
  /** Not accepted: the size comes from the parent element. */
  height?: never
}

export type AnimationCanvasProps = AnimationCanvasCommonProps &
  (AnimationCanvasFixedProps | AnimationCanvasResizableProps)

type Props = AnimationCanvasProps &
  Omit<
    ComponentPropsWithoutRef<'canvas'>,
    keyof AnimationCanvasCommonProps | 'resizable' | 'width' | 'height'
  >

/**
 * A simple animatable canvas with requestAnimationFrame()
 */
export const AnimationCanvas = /* @__PURE__ */ forwardRef<
  HTMLCanvasElement,
  Props
>(function AnimationCanvas(
  {
    // common
    draw,
    init,
    animate = true,
    options,
    reduceFlickering = true,
    // fixed
    width = 100,
    height = 100,
    // resizable
    resizable = false,
    // canvas props
    className,
    onContextMenu = (event) => event.preventDefault(),
    ...props
  },
  forwardedRef,
) {
  // See useDrag for why the node is held in state rather than a ref: an inline
  // ref would be re-attached on every render and tear the instance down.
  const [node, setNode] = useState<HTMLCanvasElement | null>(null)
  // The caller's ref gets the same element.
  const composedRef = useComposedRefs<HTMLCanvasElement>(forwardedRef, setNode)

  // Read when the instance is created. The effect below keeps it current, and
  // runs right after, so a stale handler is replaced within the same commit.
  const latest = useRef({
    draw,
    init,
    animate,
    width,
    height,
    reduceFlickering,
    options,
  })
  const instanceRef = useRef<AnimationCanvasInstance | null>(null)

  // Runs before the creation effect below. This keeps a rebuilt instance on
  // the current render's size and handlers while updating an existing one in
  // place on ordinary renders.
  useEffect(() => {
    latest.current = {
      draw,
      init,
      animate,
      width,
      height,
      reduceFlickering,
      options,
    }
    instanceRef.current?.update({
      animate,
      size: { width, height },
      reduceFlickering,
    })
  })

  useEffect(() => {
    if (!node) return

    const current = latest.current
    const instance = createAnimationCanvas(node, {
      draw: (context, frame) => latest.current.draw(context, frame),
      init: (context, size) => latest.current.init?.(context, size),
      animate: current.animate,
      size: { width: current.width, height: current.height },
      reduceFlickering: current.reduceFlickering,
      resizable,
      contextAttributes: current.options,
    })
    instanceRef.current = instance

    return () => {
      instanceRef.current = null
      instance.destroy()
    }
    // Only `resizable` decides how the instance is wired, so it is the one
    // setting that rebuilds it. `options` is read from the ref above rather
    // than depended on: it is almost always written inline, and depending on
    // it would tear the canvas down on every render.
  }, [node, resizable])

  return (
    <canvas
      className={className}
      ref={composedRef}
      onContextMenu={onContextMenu}
      {...props}
    />
  )
})
