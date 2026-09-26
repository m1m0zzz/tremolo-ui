<script lang="ts">
  import StepperButton from './StepperButton.svelte'

  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  /** Lowers the value by one `step`, repeating while held. */
  let props: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props()
</script>

<StepperButton direction={-1} {...props} />
