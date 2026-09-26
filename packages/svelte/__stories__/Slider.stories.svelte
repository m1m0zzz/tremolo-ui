<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'

  import { Slider } from '../src/index.js'

  import sliderTheme from 'shared/css/Slider.module.css'

  const { Story } = defineMeta({
    title: 'Components/Slider',
    component: Slider.Root,
    args: { min: 0, max: 100, value: 30 },
    argTypes: { value: { control: false }, children: { control: false } },
  })
</script>

<Story name="Basic">
  {#snippet template({ children: _children, ...args })}
    <Slider.Root class={sliderTheme.root} {...args}>
      <Slider.Track class={sliderTheme.track}>
        <Slider.Thumb class={sliderTheme.thumb} aria-label="Level" />
      </Slider.Track>
    </Slider.Root>
  {/snippet}
</Story>

<Story name="Marks" args={{ step: 5 }}>
  {#snippet template({ children: _children, ...args })}
    <Slider.Root class={sliderTheme.root} {...args}>
      <Slider.Track class={sliderTheme.track}>
        <Slider.Thumb class={sliderTheme.thumb} aria-label="Level" />
      </Slider.Track>
      <Slider.Marks class={sliderTheme.marks} options={25} />
    </Slider.Root>
  {/snippet}
</Story>

<Story name="Vertical" args={{ vertical: true }}>
  {#snippet template({ children: _children, ...args })}
    <Slider.Root class={sliderTheme.root} {...args}>
      <Slider.Track class={sliderTheme.track}>
        <Slider.Thumb class={sliderTheme.thumb} aria-label="Level" />
      </Slider.Track>
    </Slider.Root>
  {/snippet}
</Story>
