<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'

  import { XYPad } from '../src/index.js'

  import xyPadTheme from 'shared/css/XYPad.module.css'

  const { Story } = defineMeta({
    title: 'Components/XYPad',
    component: XYPad.Root,
    args: { min: 0, max: 100, value: [30, 60] },
    argTypes: { value: { control: false }, children: { control: false } },
  })
</script>

<Story name="Basic">
  {#snippet template({ children: _children, ...args })}
    <XYPad.Root class={xyPadTheme.root} {...args}>
      <XYPad.Area class={xyPadTheme.area}>
        <XYPad.Thumb
          class={xyPadTheme.thumb}
          aria-label={['Cutoff', 'Resonance']}
        />
      </XYPad.Area>
    </XYPad.Root>
  {/snippet}
</Story>
