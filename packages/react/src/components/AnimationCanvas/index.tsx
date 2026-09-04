import clsx from 'clsx'
import {
  ComponentPropsWithoutRef,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  createAnimationCanvas,
  type AnimationCanvasInstance,
  type AnimationFrame,
} from '@tremolo-ui/dom'

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

export interface CommonProps {
  draw: DrawFunction
  init?: InitFunction
  animate?: boolean
  /**
   * Read once, when the 2D context is created, so changing it later has no
   * effect. Passing a fresh object on every render is therefore harmless.
   *
   * @see https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext#contextattributes
   */
  options?: CanvasRenderingContext2DSettings
}

export interface AbsoluteSizingProps {
  width?: number
  height?: number
}

export interface RelativeSizingProps {
  relativeSize?: boolean
  reduceFlickering?: boolean
}

export type AnimationCanvasProps = CommonProps &
  AbsoluteSizingProps &
  RelativeSizingProps

/**
 * A simple animatable canvas with requestAnimationFrame()
 */
export function AnimationCanvas(
  props: CommonProps &
    AbsoluteSizingProps &
    Omit<ComponentPropsWithoutRef<'canvas'>, keyof AnimationCanvasProps>,
): ReactElement
export function AnimationCanvas(
  pros: CommonProps &
    RelativeSizingProps &
    Omit<ComponentPropsWithoutRef<'canvas'>, keyof AnimationCanvasProps>,
): ReactElement
export function AnimationCanvas({
  // common
  draw,
  init,
  animate = true,
  options,
  // absolute
  width = 100,
  height = 100,
  // relative
  relativeSize = false,
  reduceFlickering = true,
  // canvas props
  className,
  onContextMenu = (event) => event.preventDefault(),
  ...props
}: AnimationCanvasProps &
  Omit<
    ComponentPropsWithoutRef<'canvas'>,
    keyof AnimationCanvasProps
  >): ReactElement {
  // See useDrag for why the node is held in state rather than a ref: an inline
  // ref would be re-attached on every render and tear the instance down.
  const [node, setNode] = useState<HTMLCanvasElement | null>(null)

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
  /** Set while the instance below is newer than the effect that pushes into it. */
  const justCreated = useRef(false)

  useEffect(() => {
    if (!node) return

    const current = latest.current
    const instance = createAnimationCanvas(node, {
      draw: (context, frame) => latest.current.draw(context, frame),
      init: (context, size) => latest.current.init?.(context, size),
      animate: current.animate,
      size: { width: current.width, height: current.height },
      reduceFlickering: current.reduceFlickering,
      relativeSize,
      contextAttributes: current.options,
    })
    instanceRef.current = instance
    justCreated.current = true

    return () => {
      instanceRef.current = null
      instance.destroy()
    }
    // Only `relativeSize` decides how the instance is wired, so it is the one
    // setting that rebuilds it. `options` is read from the ref above rather
    // than depended on: it is almost always written inline, and depending on
    // it would tear the canvas down on every render.
  }, [node, relativeSize])

  // Runs after every render: the handlers come from props and are cheap to
  // push, and updating in place keeps the frame count and elapsed time going.
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
    // The instance was built from `latest` a moment ago, so there is nothing
    // to push yet. Skipping matters with `animate` off, where `update()` draws
    // a frame and would otherwise paint the same one twice on mount.
    if (justCreated.current) {
      justCreated.current = false
      return
    }
    instanceRef.current?.update({
      animate,
      size: { width, height },
      reduceFlickering,
    })
  })

  return (
    <canvas
      className={clsx('tremolo-animation-canvas', className)}
      ref={setNode}
      onContextMenu={onContextMenu}
      {...props}
    />
  )
}
