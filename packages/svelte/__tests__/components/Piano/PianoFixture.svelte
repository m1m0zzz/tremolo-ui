<script lang="ts">
  import { Piano } from '../../../src/index.js'

  import type { PianoProps } from '../../../src/index.js'

  type Props = Omit<PianoProps, 'noteRange'> & {
    withLabel?: boolean
  }

  let { withLabel = false, ...rest }: Props = $props()
  let piano: ReturnType<typeof Piano.Root> | undefined = $state()

  export function play(note: number) {
    piano?.playNote(note, 100)
  }
</script>

{#snippet keyLabel(note: number)}{note}{/snippet}

<Piano.Root
  bind:this={piano}
  noteRange={{ first: 48, last: 59 }}
  data-testid="piano"
  label={withLabel ? keyLabel : undefined}
  {...rest}
/>
