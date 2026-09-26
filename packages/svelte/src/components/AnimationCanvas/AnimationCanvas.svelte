<script lang="ts">
  import {
    createAnimationCanvas,
    type AnimationCanvasInstance,
  } from '@tremolo-ui/dom'
  import { untrack } from 'svelte'

  import type { AnimationCanvasProps } from './types.js'

  import type { HTMLCanvasAttributes } from 'svelte/elements'

  type Props = AnimationCanvasProps &
    Omit<HTMLCanvasAttributes, keyof AnimationCanvasProps>

  let {
    draw,
    init,
    animate = true,
    options,
    reduceFlickering = true,
    resizable = false,
    width = 100,
    height = 100,
    ref = $bindable(null),
    oncontextmenu = (event: MouseEvent) => event.preventDefault(),
    ...rest
  }: Props = $props()

  let instance: AnimationCanvasInstance | null = null

  // Only `resizable` decides how the instance is wired, so it is the one
  // setting that rebuilds it. Everything else is pushed with update() below,
  // and the handlers are read at call time.
  $effect(() => {
    const canvas = ref
    const wired = resizable
    if (!canvas) return
    const current = createAnimationCanvas(
      canvas,
      untrack(() => ({
        draw: (context, frame) => draw(context, frame),
        init: (context, size) => init?.(context, size),
        animate,
        size: { width, height },
        reduceFlickering,
        resizable: wired,
        contextAttributes: options,
      })),
    )
    instance = current
    return () => {
      instance = null
      current.destroy()
    }
  })

  $effect(() => {
    instance?.update({ animate, size: { width, height }, reduceFlickering })
  })
</script>

<canvas bind:this={ref} {oncontextmenu} {...rest}></canvas>
