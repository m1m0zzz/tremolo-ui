<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'

  import { DropZone } from '../src/index.js'

  import dropZoneTheme from 'shared/css/DropZone.module.css'

  const { Story } = defineMeta({
    title: 'Components/DropZone',
    component: DropZone.Root,
    args: { accept: 'audio/*' },
    argTypes: { children: { control: false } },
  })
</script>

<Story name="Basic">
  {#snippet template({ children: _children, ...args })}
    <DropZone.Root class={dropZoneTheme.root} {...args}>
      Drop audio files here
    </DropZone.Root>
  {/snippet}
</Story>
