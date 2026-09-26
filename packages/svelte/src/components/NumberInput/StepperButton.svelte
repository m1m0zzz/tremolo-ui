<script lang="ts">
  import { longPress } from '../../actions/long-press.js'

  import { useNumberInputContext, useStepperContext } from './context.js'

  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = HTMLAttributes<HTMLDivElement> & {
    direction: 1 | -1
    children?: Snippet
  }

  let { direction, children, ...rest }: Props = $props()

  const field = useNumberInputContext()
  const stepper = useStepperContext()

  const blocked = $derived(
    field.disabled || (direction > 0 ? field.atMax : field.atMin),
  )

  const pressOptions = {
    onPress: () => {
      if (field.disabled || field.readonly) return
      // Once the pointer has actually travelled, the drag on `Stepper` owns
      // the value; repeating on top of it would move it twice.
      if (stepper?.moved()) return
      field.nudge(direction, ['raw', field.step])
    },
  }
</script>

<!-- A bare arrow has no accessible name of its own. Overridable, since a
  caller may need it in their own language. `role="button"` does not take
  aria-readonly, so that state reaches the styles through the data attribute
  alone. -->
<div
  role="button"
  tabindex="-1"
  aria-label={direction > 0 ? 'Increment' : 'Decrement'}
  aria-disabled={blocked}
  data-disabled={blocked ? '' : undefined}
  data-readonly={field.readonly ? '' : undefined}
  use:longPress={pressOptions}
  {...rest}
>
  {#if children}
    {@render children()}
  {:else}
    <svg
      style="width: var(--stepper-icon-size); height: var(--stepper-icon-size)"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points={direction > 0 ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
    </svg>
  {/if}
</div>
