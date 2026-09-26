<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { SHORTCUTS } from '@tremolo-ui/dom'
  import { isWhiteKey } from '@tremolo-ui/functions'

  import { Piano } from '../src/index.js'

  import pianoTheme from 'shared/css/Piano.module.css'

  const { Story } = defineMeta({
    title: 'Components/Piano',
    component: Piano.Root,
    args: {
      noteRange: { first: 48, last: 64 },
      keyboardShortcuts: SHORTCUTS.HOME_ROW,
    },
  })

  const keyProps = (note: number) => ({
    class: isWhiteKey(note) ? pianoTheme.whiteKey : pianoTheme.blackKey,
  })
</script>

<Story name="Basic">
  {#snippet template(args)}
    <Piano.Root
      class={pianoTheme.root}
      {keyProps}
      classes={{
        keyLabelWrapper: pianoTheme.keyLabelWrapper,
        keyLabel: pianoTheme.keyLabel,
      }}
      {...args}
    >
      {#snippet label(_note, { index })}
        {SHORTCUTS.HOME_ROW.keys[index]?.toUpperCase()}
      {/snippet}
    </Piano.Root>
  {/snippet}
</Story>
