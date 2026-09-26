<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'

  import { Knob } from '../src/index.js'

  import knobTheme from 'shared/css/Knob.module.css'

  const { Story } = defineMeta({
    title: 'Components/Knob',
    component: Knob.Root,
    args: {
      min: 0,
      max: 100,
      value: 10,
      size: 50,
      wheel: ['normalized', 0.05],
      keyboard: ['normalized', 0.05],
    },
    argTypes: { value: { control: false }, children: { control: false } },
  })
</script>

<Story name="Basic">
  {#snippet template({ children: _children, ...args })}
    <Knob.Root class={knobTheme.root} aria-label="Level" {...args}>
      <Knob.SVGRoot>
        <Knob.InactiveLine class={knobTheme.inactiveLine} />
        <Knob.ActiveLine class={knobTheme.activeLine} />
        <Knob.Thumb
          class={knobTheme.thumb}
          classes={{ thumbLine: knobTheme.thumbLine }}
        />
      </Knob.SVGRoot>
    </Knob.Root>
  {/snippet}
</Story>

<Story name="Bipolar" args={{ min: -50, max: 50, value: 0, startValue: 0 }}>
  {#snippet template({ children: _children, ...args })}
    <Knob.Root class={knobTheme.root} aria-label="Level" {...args}>
      <Knob.SVGRoot>
        <Knob.InactiveLine class={knobTheme.inactiveLine} />
        <Knob.ActiveLine class={knobTheme.activeLine} />
        <Knob.Thumb
          class={knobTheme.thumb}
          classes={{ thumbLine: knobTheme.thumbLine }}
        />
      </Knob.SVGRoot>
    </Knob.Root>
  {/snippet}
</Story>
