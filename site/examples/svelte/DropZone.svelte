<script lang="ts">
  import { DropZone } from '@tremolo-ui/svelte'

  // Copy this file from the Styling page into your own project.
  import dropZoneTheme from './DropZone.module.css'

  let files: File[] = $state([])
  let rejected: File[] = $state([])
</script>

<DropZone.Root
  class={dropZoneTheme.root}
  accept="audio/*"
  multiple
  onDrop={(dropped) => {
    rejected = []
    files = dropped
  }}
  onReject={(dropped) => (rejected = dropped)}
>
  Drop an audio file here
</DropZone.Root>
<ul>
  {#each files as file (file.name)}
    <li>{file.name} ({file.type || 'unknown type'})</li>
  {/each}
</ul>
{#if rejected.length > 0}
  <p>Not audio: {rejected.map((file) => file.name).join(', ')}</p>
{/if}
