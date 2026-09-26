<script lang="ts">
  import { FileInput } from '@tremolo-ui/svelte'

  // Copy this file from the Styling page into your own project.
  import fileInputTheme from './FileInput.module.css'

  let files: File[] = $state([])
  let rejected: File[] = $state([])
</script>

<FileInput.Root
  class={fileInputTheme.root}
  accept="audio/*"
  multiple
  onChange={(picked) => {
    rejected = []
    files = picked
  }}
  onReject={(picked) => (rejected = picked)}
>
  <FileInput.Trigger class={fileInputTheme.trigger}
    >Choose audio</FileInput.Trigger
  >
  <span>{files.length > 0 ? `${files.length} selected` : 'No file'}</span>
</FileInput.Root>
<ul>
  {#each files as file (file.name)}
    <li>{file.name} ({file.type || 'unknown type'})</li>
  {/each}
</ul>
{#if rejected.length > 0}
  <p>Not audio: {rejected.map((file) => file.name).join(', ')}</p>
{/if}
