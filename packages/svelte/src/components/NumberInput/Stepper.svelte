<script lang="ts">
  import { createStepperDrag, type StepperDragInstance } from '@tremolo-ui/dom'
  import { untrack } from 'svelte'

  import { setStepperContext, useNumberInputContext } from './context.js'

  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = HTMLAttributes<HTMLDivElement> & {
    ref?: HTMLDivElement | null
    children?: Snippet
  }

  let { ref = $bindable(null), children, ...rest }: Props = $props()

  const field = useNumberInputContext()

  // Only attached while it can do something: `createDrag` puts
  // `touch-action: none` on the element, and a stepper that cannot be dragged
  // has no reason to stop the page scrolling under a finger.
  const enabled = $derived(
    field.drag !== null && !field.disabled && !field.readonly,
  )
  const options = $derived({
    range: field.rawRange,
    pixels: field.drag ?? 1,
    sensitivity: field.dragSensitivity,
    pointerLock: field.pointerLock,
  })

  let instance: StepperDragInstance | null = null

  $effect(() => {
    if (!ref || !enabled) return
    const current = createStepperDrag(ref, {
      // Read once here; the effect below keeps them current without tearing
      // the drag down.
      ...untrack(() => options),
      getValue: () => field.value,
      onChange: (next) => field.changeValue(next),
    })
    instance = current
    return () => {
      current.destroy()
      instance = null
    }
  })

  $effect(() => {
    instance?.update(options)
  })

  setStepperContext({ moved: () => instance?.moved() ?? false })
</script>

<!-- The area the steppers sit in, and a drag handle in its own right:
  dragging it up and down moves the value one `step` every `drag` pixels. -->
<div bind:this={ref} {...rest}>
  {@render children?.()}
</div>
