<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'

  import { FileInput } from '../src/index.js'

  import fileInputTheme from 'shared/css/FileInput.module.css'

  const { Story } = defineMeta({
    title: 'Components/FileInput',
    component: FileInput.Root,
    args: { accept: 'audio/*', multiple: true },
    argTypes: { children: { control: false } },
  })
</script>

<Story name="Basic">
  {#snippet template({ children: _children, ...args })}
    <FileInput.Root class={fileInputTheme.root} {...args}>
      <FileInput.Trigger class={fileInputTheme.trigger}>
        Open audio files
      </FileInput.Trigger>
    </FileInput.Root>
  {/snippet}
</Story>
