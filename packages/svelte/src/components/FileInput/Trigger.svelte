<script lang="ts">
  import { useFileInputContext } from './context.js'

  import type { Snippet } from 'svelte'
  import type { HTMLLabelAttributes } from 'svelte/elements'

  type Props = Omit<HTMLLabelAttributes, 'for'> & {
    ref?: HTMLLabelElement | null
    /** What the trigger reads. It is the accessible name of the file input. */
    children: Snippet
  }

  let { ref = $bindable(null), children, ...rest }: Props = $props()

  const fileInput = useFileInputContext()
</script>

<!-- A label rather than a button: the browser forwards the click to the
  input, the input stays the one thing in the tab order, and its name comes
  from this text. -->
<label
  bind:this={ref}
  for={fileInput.inputId}
  data-disabled={fileInput.disabled ? '' : undefined}
  {...rest}
>
  {@render children()}
</label>
