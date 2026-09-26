import { defineComponent, h, ref, watch, type PropType } from 'vue'

import {
  createAnimationCanvas,
  type AnimationCanvasInstance,
  type AnimationFrame,
} from '@tremolo-ui/dom'

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

/** A `<canvas>` drawn by `draw` on every animation frame. */
export const AnimationCanvas = /* @__PURE__ */ defineComponent({
  name: 'AnimationCanvas',
  props: {
    /** Draws a frame. */
    draw: { type: Function as PropType<DrawFunction>, required: true },
    /** Sets the canvas up before the first frame and after a resize. */
    init: Function as PropType<InitFunction>,
    /** Draw on every animation frame. @default true */
    animate: { type: Boolean, default: true },
    /** Settings for the 2D context. Read once, when the canvas is created. */
    options: Object as PropType<CanvasRenderingContext2DSettings>,
    /** Keep the drawing while the canvas is resized. @default true */
    reduceFlickering: { type: Boolean, default: true },
    /** Follow the size of the parent element; `width` and `height` are ignored. */
    resizable: Boolean,
    /** Width in CSS pixels, while not `resizable`. @default 100 */
    width: { type: Number, default: 100 },
    /** Height in CSS pixels, while not `resizable`. @default 100 */
    height: { type: Number, default: 100 },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement | null>(null)
    let instance: AnimationCanvasInstance | null = null

    // Only `resizable` decides how the instance is wired, so it is the one
    // setting that rebuilds it. The handlers are read at call time, and the
    // rest is pushed with update().
    watch(
      [canvas, () => props.resizable],
      ([element, resizable], _, onCleanup) => {
        if (!element) return
        const current = createAnimationCanvas(element, {
          draw: (context, frame) => props.draw(context, frame),
          init: (context, size) => props.init?.(context, size),
          animate: props.animate,
          size: { width: props.width, height: props.height },
          reduceFlickering: props.reduceFlickering,
          resizable,
          contextAttributes: props.options,
        })
        instance = current
        onCleanup(() => {
          if (instance === current) instance = null
          current.destroy()
        })
      },
      { immediate: true, flush: 'post' },
    )
    watch(
      () => ({
        animate: props.animate,
        size: { width: props.width, height: props.height },
        reduceFlickering: props.reduceFlickering,
      }),
      (next) => instance?.update(next),
    )

    return () =>
      h('canvas', {
        ref: canvas,
        onContextmenu: (event: MouseEvent) => event.preventDefault(),
      })
  },
})
